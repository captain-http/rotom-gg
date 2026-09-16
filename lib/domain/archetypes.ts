import { desc } from "drizzle-orm";
import { db as defaultDb, type Db } from "../db";
import { archetypes } from "../db/schema";

export type Archetype = typeof archetypes.$inferSelect;

/** A guess at which archetype a deck was, from the Pokémon it showed. */
export type Match = {
  slug: string;
  name: string;
  /** Share of the format, as a percentage of recent tournament lists. */
  share: number;
  /** 0 to 1. How much better this fits than everything else it could be. */
  confidence: number;
  /** The next best guesses, most likely first. */
  alternatives: { slug: string; name: string; confidence: number }[];
};

// Below this the guess isn't worth showing — a short game reveals two
// Pokémon, and two Pokémon are often common to a dozen decks.
const MIN_CONFIDENCE = 0.5;
// A Pokémon no list of an archetype ran isn't impossible, just unlikely.
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
 * Which archetype a deck most likely was, from the Pokémon it was seen with.
 *
 * Scores each archetype by how usual those Pokémon are in its lists, weighted
 * by how common the archetype is. Pokémon that aren't named count for
 * nothing: a battle log shows what was played, not what was in the deck.
 *
 * @param pokemon - The Pokémon seen, e.g. games.opponentPokemon.
 * @param candidates - The archetypes to choose between, from listArchetypes.
 * @returns The best match, or undefined when nothing fits well enough —
 *   which is the honest answer for a two-turn game, or for a deck nobody
 *   brings to tournaments.
 * @example
 * archetypes.findMatch(["Dreepy", "Drakloak", "Blaziken ex"], all);
 * // { slug: "dragapult-blaziken", name: "Dragapult Blaziken", confidence: 0.91, … }
 */
export function findMatch(
  pokemon: string[],
  candidates: Archetype[],
): Match | undefined {
  const seen = [...new Set(pokemon)];
  if (seen.length === 0 || candidates.length === 0) {
    return undefined;
  }

  const scored = candidates
    .map((candidate) => ({ candidate, score: score(seen, candidate) }))
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
    confidence: Math.round(confidence * 100) / 100,
    alternatives: scored.slice(1, 4).map((entry, index) => ({
      slug: entry.candidate.slug,
      name: entry.candidate.name,
      confidence: Math.round((weights[index + 1]! / total) * 100) / 100,
    })),
  };
}

// log P(archetype) + Σ log P(pokemon | archetype), all in percentages.
function score(seen: string[], candidate: Archetype): number {
  let total = Math.log(candidate.share);
  for (const name of seen) {
    total += Math.log((candidate.pokemon[name] ?? 0) + FLOOR);
  }
  return total;
}
