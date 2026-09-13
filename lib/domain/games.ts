import { and, desc, eq, getTableColumns } from "drizzle-orm";
import { db as defaultDb, type Db } from "../db";
import { decks, games } from "../db/schema";
import { findDeck } from "./decks";
import * as gameLog from "./game-log";

export type Game = typeof games.$inferSelect;

/**
 * Stores a game log on a user's deck, with the facts summarized from it.
 *
 * @param input - The Clerk user id, the deck id, and the raw battle log.
 * @param db - The database or a transaction; defaults to the shared client.
 * @returns The stored game, or undefined when the deck doesn't exist or
 *   belongs to someone else.
 */
export async function createGame(
  input: { userId: string; deckId: number; log: string },
  db: Db = defaultDb,
): Promise<Game | undefined> {
  const deck = await findDeck(input, db);
  if (!deck) {
    return undefined;
  }

  const [game] = await db
    .insert(games)
    .values({
      deckId: deck.id,
      log: input.log,
      ...gameLog.summarize(input.log),
    })
    .returning();
  if (!game) {
    throw new Error("Insert returned no game");
  }
  return game;
}

/**
 * All games on a user's deck.
 *
 * @param input - The Clerk user id and the deck id.
 * @param db - The database or a transaction; defaults to the shared client.
 * @returns The games, newest first, or an empty array when the deck has none
 *   or belongs to someone else.
 */
export async function listGames(
  input: { userId: string; deckId: number },
  db: Db = defaultDb,
): Promise<Game[]> {
  return db
    .select(getTableColumns(games))
    .from(games)
    .innerJoin(decks, eq(games.deckId, decks.id))
    .where(and(eq(games.deckId, input.deckId), eq(decks.userId, input.userId)))
    .orderBy(desc(games.id));
}
