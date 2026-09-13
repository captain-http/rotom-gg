import { and, desc, eq } from "drizzle-orm";
import { db as defaultDb, type Db } from "../db";
import { decks } from "../db/schema";

export type Deck = typeof decks.$inferSelect;

/**
 * Creates a deck owned by a user.
 *
 * @param input - The owner's Clerk user id and the deck title.
 * @param db - The database or a transaction; defaults to the shared client.
 * @returns The stored deck.
 */
export async function createDeck(
  input: { userId: string; title: string },
  db: Db = defaultDb,
): Promise<Deck> {
  const [deck] = await db.insert(decks).values(input).returning();
  if (!deck) {
    throw new Error("Insert returned no deck");
  }
  return deck;
}

/**
 * A deck, if the user owns it.
 *
 * @param input - The Clerk user id and the deck id.
 * @param db - The database or a transaction; defaults to the shared client.
 * @returns The deck, or undefined when it doesn't exist or belongs to someone
 *   else.
 */
export async function findDeck(
  input: { userId: string; deckId: number },
  db: Db = defaultDb,
): Promise<Deck | undefined> {
  const [deck] = await db
    .select()
    .from(decks)
    .where(and(eq(decks.id, input.deckId), eq(decks.userId, input.userId)));
  return deck;
}

/**
 * All of a user's decks.
 *
 * @param userId - The owner's Clerk user id.
 * @param db - The database or a transaction; defaults to the shared client.
 * @returns The decks, newest first, or an empty array.
 */
export async function listDecks(
  userId: string,
  db: Db = defaultDb,
): Promise<Deck[]> {
  return db
    .select()
    .from(decks)
    .where(eq(decks.userId, userId))
    .orderBy(desc(decks.id));
}
