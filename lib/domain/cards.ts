/**
 * What the cards in the current Standard format do.
 *
 * Import as a namespace: `import * as cards from "./cards"`.
 * Backed by card-rules.json, which `scripts/build-card-rules.ts` generates.
 */

import cardRules from "./card-rules.json";

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
  /** Where this version was printed, as "SET number": ["TWM 130"]. */
  prints: string[];
};

/** A card name, and every distinct printing of it in the format. */
export type Card = {
  name: string;
  category: "pokemon" | "trainer" | "energy";
  printings: Printing[];
};

const CARD_RULES = cardRules as unknown as Record<
  string,
  Omit<Card, "name"> | undefined
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
 * The version of a card printed at one set and number.
 *
 * A decklist can name a printing from outside the format — an older set's
 * copy of a card that's still legal through a reprint. When every printing
 * of the name reads the same, that one is returned anyway.
 *
 * @param name - The card name.
 * @param set - The set's official code, e.g. "TWM".
 * @param number - The collector number, with or without zero padding.
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
  number: string,
): Printing | undefined {
  const printings = findCard(name)?.printings ?? [];
  const print = `${set} ${number.replace(/^0+(?=.)/, "")}`;
  const exact = printings.find((printing) => printing.prints.includes(print));
  return exact ?? (printings.length === 1 ? printings[0] : undefined);
}
