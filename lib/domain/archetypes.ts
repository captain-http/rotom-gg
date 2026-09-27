import { desc, sql } from "drizzle-orm";
import { db as defaultDb, type Db } from "../db/index.ts";
import { archetypes } from "../db/schema.ts";
import * as gameLog from "./game-log.ts";

export type Archetype = typeof archetypes.$inferSelect;

/** A guess at which archetype a deck was, from the cards it showed. */
export type Match = {
  slug: string;
  name: string;
  /** Share of the format, as a percentage of recent tournament lists. */
  share: number;
  /**
   * The archetype's Signature Pokémon, as Limitless names their sprites, or
   * null when the archetypes were rebuilt before those were stored.
   */
  signaturePokemon: string[] | null;
  /** 0 to 1. How much better this fits than everything else it could be. */
  confidence: number;
  /** The next best guesses, most likely first. */
  alternatives: { slug: string; name: string; confidence: number }[];
};

/** What findMatch needs of an archetype: none of the decklist. */
export type Candidate = Pick<
  Archetype,
  "slug" | "name" | "share" | "playRates" | "icons"
>;

// Below this the guess isn't worth showing — a short game reveals two
// Pokémon and a few staples, and those are often common to a dozen decks.
const MIN_CONFIDENCE = 0.5;
// A card no list of an archetype ran isn't impossible, just unlikely.
const FLOOR = 0.5;

/**
 * Every archetype in the format, commonest first.
 *
 * @param db - The database or a transaction; defaults to the shared client.
 * @returns The archetypes, or an empty array before the first rebuild.
 */
export async function listArchetypes(db: Db = defaultDb): Promise<Archetype[]> {
  return db.select().from(archetypes).orderBy(desc(archetypes.lists));
}

/**
 * An archetype by the name Limitless calls it, however it was capitalized.
 *
 * @param name - The display name, e.g. "Dragapult Dusknoir".
 * @param db - The database or a transaction; defaults to the shared client.
 * @returns The archetype, or undefined when the format has no deck by that
 *   name — including one that has rotated out since a game was played.
 */
export async function findArchetypeByName(
  name: string,
  db: Db = defaultDb,
): Promise<Archetype | undefined> {
  const [found] = await db
    .select()
    .from(archetypes)
    .where(sql`lower(${archetypes.name}) = lower(${name})`)
    .limit(1);
  return found;
}

/**
 * Every archetype's name and share, without the decklists.
 *
 * Cheap next to listArchetypes: the consensus lists are the bulk of a row,
 * and naming what exists doesn't need them.
 *
 * @param db - The database or a transaction; defaults to the shared client.
 * @returns Names with their share of the format, commonest first.
 */
export async function listArchetypeNames(
  db: Db = defaultDb,
): Promise<{ name: string; share: number }[]> {
  return db
    .select({ name: archetypes.name, share: archetypes.share })
    .from(archetypes)
    .orderBy(desc(archetypes.lists));
}

/**
 * Every archetype in the format with what findMatch scores it by, commonest
 * first. Cheap next to listArchetypes, which carries the decklists.
 *
 * @param db - The database or a transaction; defaults to the shared client.
 * @returns The candidates, or an empty array before the first rebuild.
 */
export async function listCandidates(db: Db = defaultDb): Promise<Candidate[]> {
  return db
    .select({
      slug: archetypes.slug,
      name: archetypes.name,
      share: archetypes.share,
      playRates: archetypes.playRates,
      icons: archetypes.icons,
    })
    .from(archetypes)
    .orderBy(desc(archetypes.lists));
}

/**
 * Which archetype a deck most likely was, from the cards it was seen with.
 *
 * Scores each archetype by how usual those cards are in its lists, weighted
 * by how common the archetype is. Pokémon, Trainers and Energy all count: a
 * staple every deck runs moves no archetype ahead of another, while a card
 * few decks run moves the ones that do. Cards that aren't named count for
 * nothing: a battle log shows what was played, not what was in the deck.
 *
 * @param seen - Card names seen, as gameLog.getOpponentCards sorts them:
 *   its pokemon, trainers and energy together.
 * @param candidates - The archetypes to choose between, from listCandidates.
 * @returns The best match, or undefined when nothing fits well enough —
 *   which is the honest answer for a two-turn game, or for a deck nobody
 *   brings to tournaments.
 * @example
 * archetypes.findMatch(["Dreepy", "Unfair Stamp", "Basic Psychic Energy"], all);
 * // { slug: "dragapult-ex", name: "Dragapult ex", confidence: 0.56, … }
 */
export function findMatch(
  seen: string[],
  candidates: Candidate[],
): Match | undefined {
  const names = [...new Set(seen.map(toListName))];
  if (names.length === 0 || candidates.length === 0) {
    return undefined;
  }

  const scored = candidates
    .map((candidate) => ({ candidate, score: score(names, candidate) }))
    .sort((a, b) => b.score - a.score);

  // Softmax over the log scores, so confidence says "how much better than the
  // alternatives" rather than "how likely in the abstract".
  const top = scored[0]!.score;
  const weights = scored.map((entry) => Math.exp(entry.score - top));
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  const confidence = weights[0]! / total;
  if (confidence < MIN_CONFIDENCE) {
    return undefined;
  }

  const best = scored[0]!.candidate;
  return {
    slug: best.slug,
    name: best.name,
    share: best.share,
    signaturePokemon: best.icons.length > 0 ? best.icons : null,
    confidence: Math.round(confidence * 100) / 100,
    alternatives: scored.slice(1, 4).map((entry, index) => ({
      slug: entry.candidate.slug,
      name: entry.candidate.name,
      confidence: Math.round((weights[index + 1]! / total) * 100) / 100,
    })),
  };
}

/**
 * Which archetype the opponent in a battle log most likely played, from every
 * card the log shows them with.
 *
 * @param log - The raw battle log.
 * @param candidates - The archetypes to choose between, from listCandidates.
 * @returns The best match, or undefined as findMatch gives it.
 */
export function findOpponentMatch(
  log: string,
  candidates: Candidate[],
): Match | undefined {
  const seen = gameLog.getOpponentCards(log);
  return findMatch(
    [...seen.pokemon, ...seen.trainers, ...seen.energy],
    candidates,
  );
}

// log P(archetype) + Σ log P(card | archetype), all in percentages.
function score(names: string[], candidate: Candidate): number {
  let total = Math.log(candidate.share);
  for (const name of names) {
    total += Math.log((candidate.playRates[name] ?? 0) + FLOOR);
  }
  return total;
}

// A log names Basic Energy "Basic Psychic Energy"; a decklist, "Psychic
// Energy".
function toListName(name: string): string {
  return name.replace(/^Basic (?=\S+ Energy$)/, "");
}
