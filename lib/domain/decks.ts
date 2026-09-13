import { desc, eq } from "drizzle-orm";
import { db as defaultDb, type Db } from "../db";
import { decks } from "../db/schema";

export type Deck = typeof decks.$inferSelect;

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

// Newest first.
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
