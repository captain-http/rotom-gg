import { and, count, desc, eq, getTableColumns } from "drizzle-orm";
import { db as defaultDb, type Db } from "../db";
import { decks, games } from "../db/schema";
import { findDeck } from "./decks";
import * as gameLog from "./game-log";
import type { Language } from "./log-check";

export type Game = typeof games.$inferSelect;

/**
 * Stores a game log on a user's deck, with the facts summarized from it.
 *
 * @param input - The Clerk user id, the deck id, the raw battle log, and the
 *   language it's in when known (logCheck.check).
 * @param db - The database or a transaction; defaults to the shared client.
 * @returns The stored game, or undefined when the deck doesn't exist or
 *   belongs to someone else.
 */
export async function createGame(
  input: {
    userId: string;
    deckId: number;
    log: string;
    language?: Language | null;
  },
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
      language: input.language ?? null,
    })
    .returning();
  if (!game) {
    throw new Error("Insert returned no game");
  }
  return game;
}

/**
 * A single game, if the user owns the deck it belongs to.
 *
 * @param input - The Clerk user id and the game id.
 * @param db - The database or a transaction; defaults to the shared client.
 * @returns The game, or undefined when it doesn't exist or belongs to someone
 *   else.
 */
export async function findGame(
  input: { userId: string; gameId: number },
  db: Db = defaultDb,
): Promise<Game | undefined> {
  const [game] = await db
    .select(getTableColumns(games))
    .from(games)
    .innerJoin(decks, eq(games.deckId, decks.id))
    .where(and(eq(games.id, input.gameId), eq(decks.userId, input.userId)));
  return game;
}

/**
 * A user's games, on one deck or across all of them.
 *
 * @param input - The Clerk user id; optionally a deck id to keep to that deck,
 *   and a limit on how many to return.
 * @param db - The database or a transaction; defaults to the shared client.
 * @returns The games, newest first, or an empty array when there are none or
 *   the deck belongs to someone else.
 */
export async function listGames(
  input: { userId: string; deckId?: number; limit?: number },
  db: Db = defaultDb,
): Promise<Game[]> {
  const query = db
    .select(getTableColumns(games))
    .from(games)
    .innerJoin(decks, eq(games.deckId, decks.id))
    .where(
      and(
        eq(decks.userId, input.userId),
        input.deckId === undefined ? undefined : eq(games.deckId, input.deckId),
      ),
    )
    .orderBy(desc(games.id));
  return input.limit === undefined ? query : query.limit(input.limit);
}

/**
 * How many games a user has on one deck.
 *
 * @param input - The Clerk user id and the deck id.
 * @param db - The database or a transaction; defaults to the shared client.
 * @returns The number of games; 0 when the deck belongs to someone else.
 */
export async function countGames(
  input: { userId: string; deckId: number },
  db: Db = defaultDb,
): Promise<number> {
  const [row] = await db
    .select({ count: count() })
    .from(games)
    .innerJoin(decks, eq(games.deckId, decks.id))
    .where(and(eq(decks.userId, input.userId), eq(games.deckId, input.deckId)));
  return row?.count ?? 0;
}
