/**
 * What the cards in the current Standard format do.
 *
 * Import as a namespace: `import * as cards from "./cards"`.
 * Backed by card-rules.json and card-names.json, which
 * `scripts/build-card-rules.ts` generates.
 */

import cardNames from "./card-names.json" with { type: "json" };
import cardRules from "./card-rules.json" with { type: "json" };

/** One version of a card. Reprints often differ, so a name can have several. */
export type Printing = {
  /** Supporter, Item, Stadium, Tool; Basic, Stage1, Stage2; Normal, Special. */
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
  /** The rules text of a Trainer or Special Energy. */
  effect?: string;
  /** A Tera Pokémon: no damage from attacks while it's on the Bench. */
  tera?: true;
  /** Where this version was printed, as "SET number": ["TWM 130"]. */
  prints: string[];
};

/** A card name, and every distinct printing of it in the format. */
export type Card = {
  name: string;
  category: "pokemon" | "trainer" | "energy";
  printings: Printing[];
};

/** A language PTCGL can be played in, as TCGdex codes it. */
export type Language = "en" | Translated;

/** A language that gives the cards names of its own. */
export type Translated = "fr" | "de" | "it" | "es" | "es-mx" | "pt";

const CARD_RULES = cardRules as unknown as Record<
  string,
  Omit<Card, "name"> | undefined
>;
const CARD_NAMES = cardNames as Record<
  Translated,
  Record<string, string | undefined>
>;

/**
 * What a card does, if it's in the current format.
 *
 * A name can carry more than one printing: reprints aren't always identical,
 * and a battle log names a card without saying which printing was played.
 *
 * @param name - The card name, exactly as a battle log spells it.
 * @returns The card, or undefined when the format doesn't have that name —
 *   which includes every card that has rotated out.
 * @example
 * cards.findCard("Night Stretcher");
 * // { name: "Night Stretcher", category: "trainer", printings: [{ type: "Item", effect: "…" }] }
 */
export function findCard(name: string): Card | undefined {
  const card = CARD_RULES[name];
  return card ? { name, ...card } : undefined;
}

/**
 * What each of several cards does, skipping the ones the format doesn't have.
 *
 * @param names - Card names, as a battle log spells them.
 * @returns The cards that are in the format, in the order asked for, with
 *   duplicates removed. Empty when none of them are.
 */
export function listCards(names: string[]): Card[] {
  const found = new Map<string, Card>();
  for (const name of names) {
    const card = findCard(name);
    if (card && !found.has(name)) {
      found.set(name, card);
    }
  }
  return [...found.values()];
}

/**
 * The version of a card printed at one set and collector number.
 *
 * A decklist can name a printing from outside the format — an older set's
 * copy of a card that's still legal through a reprint. When every printing
 * of the name reads the same, that one is returned anyway.
 *
 * @param name - The card name.
 * @param set - The set's official code, e.g. "TWM".
 * @param collectorNumber - The collector number, with or without zero padding.
 * @returns The printing, or undefined when the format has no card by that
 *   name — including basic Energy, which has no rules text — or when it has
 *   several versions and none was printed there.
 * @example
 * cards.findPrinting("Dragapult ex", "TWM", "130");
 * // { type: "Stage2", hp: 320, attacks: [...], prints: ["TWM 130", …] }
 */
export function findPrinting(
  name: string,
  set: string,
  collectorNumber: string,
): Printing | undefined {
  const printings = findCard(name)?.printings ?? [];
  const print = `${set} ${collectorNumber.replace(/^0+(?=.)/, "")}`;
  const exact = printings.find((printing) => printing.prints.includes(print));
  return exact ?? (printings.length === 1 ? printings[0] : undefined);
}

/**
 * A card's English name, from its name in another language.
 *
 * Everything else here goes by English name, so this is the way in for a
 * card named in another language. The two Spanishes fall back to each
 * other: TCGdex only has Latin America's from Journey Together on, and
 * Spain's table renames the cards Latin America leaves as Lillie's.
 *
 * @param name - The card name in that language, e.g. "Melenaleteo".
 * @param language - The language it's written in.
 * @returns The English name — the same name when the language doesn't
 *   translate it — or undefined when no card in the format has that name.
 * @example
 * cards.findEnglishName("Melenaleteo", "es"); // "Flutter Mane"
 * cards.findEnglishName("Slowking", "es"); // "Slowking"
 */
export function findEnglishName(
  name: string,
  language: Translated,
): string | undefined {
  const key = name.replaceAll("’", "'");
  const spanish = language === "es" ? "es-mx" : "es";
  const translated =
    CARD_NAMES[language][key] ??
    (language.startsWith("es") ? CARD_NAMES[spanish][key] : undefined);
  return translated ?? (findCard(key) ? key : undefined);
}
