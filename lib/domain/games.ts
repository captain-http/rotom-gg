import { and, desc, eq, getTableColumns } from "drizzle-orm";
import { db as defaultDb, type Db } from "../db";
import { decks, games } from "../db/schema";
import { getDeck } from "./decks";

export type Game = typeof games.$inferSelect;

// Undefined when the deck doesn't exist or belongs to someone else.
export async function createGame(
  input: { userId: string; deckId: number; log: string },
  db: Db = defaultDb,
): Promise<Game | undefined> {
  const deck = await getDeck(input, db);
  if (!deck) {
    return undefined;
  }

  const [game] = await db
    .insert(games)
    .values({ deckId: deck.id, log: input.log })
    .returning();
  if (!game) {
    throw new Error("Insert returned no game");
  }
  return game;
}

// Newest first. Empty when the deck belongs to someone else.
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
