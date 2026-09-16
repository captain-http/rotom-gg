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
 * Separate from card-index.json on purpose. That one answers "what kind of
 * card is this name", needs every card ever printed, and is read by the
 * parser. This one answers "what does this card do", only covers cards that
 * can be in a current game, and is read when someone asks a question.
 *
 * Keyed by name, because a battle log only ever gives a name. Unlike the kind
 * of a card, what it does is *not* stable across printings — around a third of
 * names in the format have more than one version — so each name carries every
 * distinct printing and the caller decides what to do with the ambiguity.
 *
 * Two TCGdex traps, if you extend this. Its `name` filter is a substring
 * match, so "Iono" also returns "Iono's Bellibolt ex" — don't use it to check
 * whether a card is in the format. And `legal.standard` comes back true for
 * cards as old as Base Set. Regulation mark is the honest definition.
 */

import { writeFileSync } from "node:fs";

const API = "https://api.tcgdex.net/v2";
const OUT = new URL("../lib/domain/card-rules.json", import.meta.url);

// Scarlet & Violet onward, minus the marks that have rotated out. G rotated,
// which is why Iono and Charizard ex aren't in here.
const REGULATION_MARKS = ["H", "I", "J"];

type ApiCard = {
  name: string;
  category: "Pokemon" | "Trainer" | "Energy";
  stage: string | null;
  trainerType: string | null;
  energyType: string | null;
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
};

type CardRules = {
  category: "pokemon" | "trainer" | "energy";
  printings: Printing[];
};

async function main() {
  const cards = (
    await Promise.all(REGULATION_MARKS.map((mark) => getCards(mark)))
  ).flat();

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
    const printing = toPrinting(card);
    const serialized = JSON.stringify(printing);
    // Most reprints read identically; keep one of each distinct version.
    if (!entry.printings.some((seen) => JSON.stringify(seen) === serialized)) {
      entry.printings.push(printing);
    }
    rules.set(card.name, entry);
  }
  if (conflicts.length > 0) {
    throw new Error(`Names printed as different kinds: ${conflicts}`);
  }

  const sorted = Object.fromEntries(
    [...rules].sort(([a], [b]) => a.localeCompare(b)),
  );
  writeFileSync(OUT, `${JSON.stringify(sorted, null, 2)}\n`);

  const printings = [...rules.values()].reduce(
    (count, entry) => count + entry.printings.length,
    0,
  );
  console.log(
    `Wrote ${rules.size} cards (${printings} printings) to ${OUT.pathname}`,
  );
}

function toPrinting(card: ApiCard): Printing {
  return {
    type: card.trainerType ?? card.energyType ?? card.stage,
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

async function getCards(mark: string): Promise<ApiCard[]> {
  const { data, errors } = await postGraphql<{ cards: ApiCard[] }>(`{
    cards(filters: { regulationMark: "${mark}" }) {
      name category stage trainerType energyType hp retreat types evolveFrom effect
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
