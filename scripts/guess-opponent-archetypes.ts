/**
 * Guesses the opponent's archetype for games that don't have one yet: games
 * filed before guessing existed, or while the archetypes table was empty.
 *
 *     node --env-file=.env scripts/guess-opponent-archetypes.ts
 *
 * Run it after scripts/build-archetypes.ts. Games already guessed keep their
 * guess — it was made against the format they were played in. A game the log
 * says too little about stays null and is tried again on the next run.
 */

import { eq, isNull } from "drizzle-orm";
import { db, pool } from "../lib/db/index.ts";
import { games } from "../lib/db/schema.ts";
import * as archetypes from "../lib/domain/archetypes.ts";

async function main() {
  const candidates = await archetypes.listCandidates();
  // Scoring against empty play rates would guess by popularity alone.
  if (!candidates.some((c) => Object.keys(c.playRates).length > 0)) {
    throw new Error("No play rates yet: run scripts/build-archetypes.ts first");
  }

  const unguessed = await db
    .select({ id: games.id, log: games.log })
    .from(games)
    .where(isNull(games.opponentArchetype));
  console.log(`${unguessed.length} games without a guess.`);

  let guessed = 0;
  for (const game of unguessed) {
    const match = archetypes.findOpponentMatch(game.log, candidates);
    if (!match) continue;
    await db
      .update(games)
      .set({ opponentArchetype: match.name })
      .where(eq(games.id, game.id));
    guessed++;
  }
  console.log(`Guessed ${guessed}; ${unguessed.length - guessed} too unsure.`);
  await pool.end();
}

await main();
