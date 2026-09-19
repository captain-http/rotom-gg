/**
 * Regenerates lib/domain/card-rules.json: what every card in the current
 * Standard format does, from TCGdex (MIT,
 * https://github.com/tcgdex/cards-database).
 *
 *     node scripts/build-card-rules.ts
 *
 * Rerun when a set releases, and after a rotation — the format is defined
 * here by regulation mark, so rotating means editing REGULATION_MARKS and
 * rebuilding. The file is a snapshot of the format on the day it was built.
 *
 * The log parser sorts cards into kinds with this file too, so a rotated card
 * lands in `unknown`. That's intended: rotom.gg only covers Standard.
 *
 * Keyed by name, because a battle log only ever gives a name. Every printing
 * of a name is the same kind of card, but what it does is *not* stable across printings — around a third of
 * names in the format have more than one version — so each name carries every
 * distinct printing and the caller decides what to do with the ambiguity.
 * Each printing lists where it was printed, as "SET number" with the set's
 * official code and no zero padding ("TWM 130") — the form Limitless uses —
 * so a decklist that names its printing can be matched exactly.
 *
 * TCGdex doesn't say which Pokémon are Tera, and attacks like Gemstone
 * Mimicry turn on it, so the Tera printings come from the Pokémon TCG API
 * (https://pokemontcg.io), matched on "SET number". That API is slow and often
 * fails, so it's asked one small question — every Tera card — with retries.
 *
 * It also writes lib/domain/card-names.json: each format card's name in every
 * other language PTCGL is played in, pointing at its English name, for logs
 * exported in those languages. Only names that differ from English are kept.
 * TCGdex's GraphQL only speaks English, so these come from REST, and a card
 * is the same card across languages by its TCGdex id ("sv05-078" is Flutter
 * Mane and Melenaleteo).
 *
 * Three TCGdex traps, if you extend this. Its `name` filter is a substring
 * match, so "Iono" also returns "Iono's Bellibolt ex" — don't use it to check
 * whether a card is in the format. And `legal.standard` comes back true for
 * cards as old as Base Set. Regulation mark is the honest definition. And
 * `energyType` isn't reliable: the Ascended Heroes reprint of Team Rocket's
 * Energy comes back "Normal". In the format, basic Energy are exactly the
 * cards named "Basic … Energy", so the type is read from the name.
 */

import { writeFileSync } from "node:fs";

const API = "https://api.tcgdex.net/v2";
const POKEMON_TCG_API = "https://api.pokemontcg.io/v2";
const OUT = new URL("../lib/domain/card-rules.json", import.meta.url);
const NAMES_OUT = new URL("../lib/domain/card-names.json", import.meta.url);

// Scarlet & Violet onward, minus the marks that have rotated out. G rotated,
// which is why Iono and Charizard ex aren't in here.
const REGULATION_MARKS = ["H", "I", "J"];

// PTCGL's languages besides English, as TCGdex codes them. Its "pt" is
// Brazilian Portuguese; "pt-br" there holds only TCG Pocket. Its "es-mx"
// (Latin America) only starts at Journey Together, so cards.findEnglishName
// falls back to Spain's "es" for older sets.
const LANGUAGES = ["fr", "de", "it", "es", "es-mx", "pt"];

type ApiCard = {
  id: string;
  name: string;
  localId: string;
  set: { id: string };
  category: "Pokemon" | "Trainer" | "Energy";
  stage: string | null;
  trainerType: string | null;
  hp: number | null;
  retreat: number | null;
  types: string[] | null;
  evolveFrom: string | null;
  effect: string | null;
  attacks:
    | {
        name: string;
        cost: string[] | null;
        damage: string | null;
        effect: string | null;
      }[]
    | null;
  abilities: { name: string; effect: string | null }[] | null;
  weaknesses: { type: string; value: string | null }[] | null;
};

type Printing = {
  type: string | null;
  hp?: number;
  retreat?: number;
  types?: string[];
  weakness?: string[];
  evolveFrom?: string;
  attacks?: {
    name: string;
    cost: string[];
    damage: string | null;
    effect: string | null;
  }[];
  abilities?: { name: string; effect: string | null }[];
  effect?: string;
  /** A Tera Pokémon: no damage from attacks while it's on the Bench. */
  tera?: true;
  prints: string[];
};

type CardRules = {
  category: "pokemon" | "trainer" | "energy";
  printings: Printing[];
};

async function main() {
  const [cards, teraPrints, localized] = await Promise.all([
    Promise.all(REGULATION_MARKS.map((mark) => getCards(mark))).then((all) =>
      all.flat(),
    ),
    getTeraPrints(),
    Promise.all(LANGUAGES.map((language) => getLocalizedNames(language))),
  ]);

  const setCodes = await getSetCodes(new Set(cards.map((card) => card.set.id)));

  const rules = new Map<string, CardRules>();
  const conflicts: string[] = [];
  for (const card of cards) {
    const category = card.category.toLowerCase() as CardRules["category"];
    const existing = rules.get(card.name);
    if (existing && existing.category !== category) {
      conflicts.push(card.name);
      continue;
    }

    const entry = existing ?? { category, printings: [] };
    const text = toText(card);
    const serialized = JSON.stringify(text);
    const print = `${setCodes.get(card.set.id)} ${card.localId.replace(/^0+(?=.)/, "")}`;
    // Most reprints read identically; keep one of each distinct version, and
    // every place it was printed.
    const seen = entry.printings.find(
      (other) => JSON.stringify({ ...other, prints: undefined }) === serialized,
    );
    if (seen) {
      seen.prints.push(print);
    } else {
      entry.printings.push({ ...text, prints: [print] });
    }
    rules.set(card.name, entry);
  }
  if (conflicts.length > 0) {
    throw new Error(`Names printed as different kinds: ${conflicts}`);
  }

  // Marked after grouping: a printing is Tera when any place it was printed
  // is. Promos don't match on code between the two APIs, but a Tera promo
  // reads like its set printing, so it shares that printing's entry.
  let tera = 0;
  for (const entry of rules.values()) {
    for (const printing of entry.printings) {
      if (printing.prints.some((print) => teraPrints.has(print))) {
        printing.tera = true;
        tera++;
      }
    }
  }
  if (tera === 0) {
    throw new Error("No Tera printings matched; the API or codes changed");
  }

  const sorted = Object.fromEntries(
    [...rules].sort(([a], [b]) => a.localeCompare(b)),
  );
  writeFileSync(OUT, `${JSON.stringify(sorted, null, 2)}\n`);

  const names = toNameTables(cards, rules, localized);
  writeFileSync(NAMES_OUT, `${JSON.stringify(names, null, 2)}\n`);

  const printings = [...rules.values()].reduce(
    (count, entry) => count + entry.printings.length,
    0,
  );
  console.log(
    `Wrote ${rules.size} cards (${printings} printings, ${tera} Tera) to ${OUT.pathname}`,
  );
  console.log(
    `Wrote ${Object.entries(names)
      .map(([language, table]) => `${Object.keys(table).length} ${language}`)
      .join(", ")} names to ${NAMES_OUT.pathname}`,
  );
}

// { language: { localized name: English name } }, skipping names that read
// the same as in English. Apostrophes are straightened, as the log parser
// does before looking a card up.
function toNameTables(
  cards: ApiCard[],
  rules: Map<string, CardRules>,
  localized: Map<string, string>[],
): Record<string, Record<string, string>> {
  const english = new Map(
    cards
      .filter((card) => rules.has(card.name))
      .map((card) => [card.id, card.name]),
  );
  const tables: Record<string, Record<string, string>> = {};
  const clashes: string[] = [];
  LANGUAGES.forEach((language, index) => {
    const table = new Map<string, string>();
    for (const [id, name] of localized[index]!) {
      const englishName = english.get(id);
      const key = name.replaceAll("’", "'");
      if (!englishName || key === englishName) continue;
      const existing = table.get(key);
      if (existing && existing !== englishName) {
        clashes.push(`${language} ${key}: ${existing}, ${englishName}`);
      }
      table.set(key, englishName);
    }
    tables[language] = Object.fromEntries(
      [...table].sort(([a], [b]) => a.localeCompare(b)),
    );
  });
  // One name for two English cards can't be undone from a log. None exist
  // today; if one appears, decide by hand rather than guess.
  if (clashes.length > 0) {
    throw new Error(`Localized names shared by different cards: ${clashes}`);
  }
  return tables;
}

function toText(card: ApiCard): Omit<Printing, "prints"> {
  return {
    type:
      card.category === "Energy"
        ? /^Basic .+ Energy$/.test(card.name)
          ? "Normal"
          : "Special"
        : (card.trainerType ?? card.stage),
    ...(card.hp ? { hp: card.hp } : {}),
    ...(card.retreat != null ? { retreat: card.retreat } : {}),
    ...(card.types?.length ? { types: card.types } : {}),
    ...(card.weaknesses?.length
      ? { weakness: card.weaknesses.map((weakness) => weakness.type) }
      : {}),
    ...(card.evolveFrom ? { evolveFrom: card.evolveFrom } : {}),
    ...(card.attacks?.length
      ? {
          attacks: card.attacks.map((attack) => ({
            name: attack.name,
            cost: attack.cost ?? [],
            damage: attack.damage,
            effect: attack.effect,
          })),
        }
      : {}),
    ...(card.abilities?.length
      ? {
          abilities: card.abilities.map((ability) => ({
            name: ability.name,
            effect: ability.effect,
          })),
        }
      : {}),
    ...(card.effect ? { effect: card.effect } : {}),
  };
}

// Every Tera card ever printed, as "SET number". A few hundred at most, so one
// page; retried because the API fails often, sometimes with an HTML error page.
async function getTeraPrints(): Promise<Set<string>> {
  const url = `${POKEMON_TCG_API}/cards?q=subtypes:Tera&pageSize=250&select=number,set`;
  for (let attempt = 1; ; attempt++) {
    try {
      const response = await fetch(url);
      const body = (await response.json()) as {
        data?: { number: string; set: { ptcgoCode?: string } }[];
        totalCount?: number;
      };
      if (!body.data) throw new Error(`status ${response.status}`);
      if (body.data.length !== body.totalCount) {
        throw new Error(`Tera cards span pages: ${body.totalCount}`);
      }
      return new Set(
        body.data.map((card) => `${card.set.ptcgoCode} ${card.number}`),
      );
    } catch (error) {
      if (attempt === 8) throw error;
      console.warn(`Tera cards, attempt ${attempt}: ${error}`);
      await new Promise((resolve) => setTimeout(resolve, attempt * 3000));
    }
  }
}

// GraphQL doesn't expose a set's official code, so read each from REST.
async function getSetCodes(ids: Set<string>): Promise<Map<string, string>> {
  const entries = await Promise.all(
    [...ids].map(async (id) => {
      const response = await fetch(`${API}/en/sets/${id}`);
      if (!response.ok) throw new Error(`Set ${id}: ${response.status}`);
      const set = (await response.json()) as {
        abbreviation?: { official?: string };
      };
      const code = set.abbreviation?.official;
      if (!code) throw new Error(`Set ${id} has no official code`);
      return [id, code] as const;
    }),
  );
  return new Map(entries);
}

async function getCards(mark: string): Promise<ApiCard[]> {
  const { data, errors } = await postGraphql<{ cards: ApiCard[] }>(`{
    cards(filters: { regulationMark: "${mark}" }) {
      id name localId set { id } category stage trainerType hp retreat types evolveFrom effect
      attacks { name cost damage effect }
      abilities { name effect }
      weaknesses { type value }
    }
  }`);
  if (errors?.length || !data) {
    throw new Error(`TCGdex query failed: ${JSON.stringify(errors)}`);
  }
  return data.cards;
}

// Every format card's name in one language, by TCGdex id. A card the language
// hasn't been printed in is missing, not an error.
async function getLocalizedNames(
  language: string,
): Promise<Map<string, string>> {
  const names = new Map<string, string>();
  for (const mark of REGULATION_MARKS) {
    const response = await fetch(
      `${API}/${language}/cards?regulationMark=${mark}`,
    );
    if (!response.ok) {
      throw new Error(`${language} cards, mark ${mark}: ${response.status}`);
    }
    const cards = (await response.json()) as { id: string; name: string }[];
    for (const card of cards) names.set(card.id, card.name);
  }
  if (names.size === 0) {
    throw new Error(`No ${language} cards; TCGdex changed its language codes`);
  }
  return names;
}

async function postGraphql<T>(
  query: string,
): Promise<{ data?: T; errors?: unknown[] }> {
  const response = await fetch(`${API}/graphql`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query }),
  });
  if (!response.ok) throw new Error(`GraphQL: ${response.status}`);
  return (await response.json()) as { data?: T; errors?: unknown[] };
}

await main();
