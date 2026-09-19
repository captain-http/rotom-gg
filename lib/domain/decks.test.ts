import { expect, test } from "vitest";
import { withRollback } from "../../test/db";
import { eq } from "drizzle-orm";
import { games } from "../db/schema";
import {
  createDeck,
  deleteDeck,
  findDeck,
  findWinRate,
  listDecks,
} from "./decks";

const noGames = { wins: 0, losses: 0 };

test("createDeck stores the deck for the user", () =>
  withRollback(async (db) => {
    const deck = await createDeck(
      { userId: "user_red", title: "Gholdengo" },
      db,
    );

    expect(deck).toMatchObject({ userId: "user_red", title: "Gholdengo" });
    expect(await listDecks("user_red", db)).toEqual([{ ...deck, ...noGames }]);
  }));

test("listDecks returns newest first", () =>
  withRollback(async (db) => {
    const first = await createDeck({ userId: "user_red", title: "First" }, db);
    const second = await createDeck(
      { userId: "user_red", title: "Second" },
      db,
    );

    expect(await listDecks("user_red", db)).toEqual([
      { ...second, ...noGames },
      { ...first, ...noGames },
    ]);
  }));

test("decks count wins and losses, skipping unknown results", () =>
  withRollback(async (db) => {
    const deck = await createDeck({ userId: "user_red", title: "Deck" }, db);
    // Rows, not logs: the parser has no real loss fixture yet.
    await db.insert(games).values(
      ["win", "win", "loss", null].map((result) => ({
        deckId: deck.id,
        log: "",
        result: result as "win" | "loss" | null,
      })),
    );

    const record = { ...deck, wins: 2, losses: 1 };
    expect(await listDecks("user_red", db)).toEqual([record]);
    expect(await findDeck({ userId: "user_red", deckId: deck.id }, db)).toEqual(
      record,
    );
  }));

test("findWinRate rounds the share of decided games won", () => {
  expect(findWinRate({ wins: 5, losses: 2 })).toBe(71);
  expect(findWinRate({ wins: 0, losses: 3 })).toBe(0);
  expect(findWinRate({ wins: 4, losses: 0 })).toBe(100);
  expect(findWinRate({ wins: 0, losses: 0 })).toBeUndefined();
});

test("listDecks never returns another user's decks", () =>
  withRollback(async (db) => {
    await createDeck({ userId: "user_blue", title: "Not yours" }, db);

    expect(await listDecks("user_red", db)).toEqual([]);
  }));

test("deleteDeck removes the deck and its games", () =>
  withRollback(async (db) => {
    const deck = await createDeck({ userId: "user_red", title: "Deck" }, db);
    await db.insert(games).values({ deckId: deck.id, log: "" });

    expect(await deleteDeck({ userId: "user_red", deckId: deck.id }, db)).toBe(
      true,
    );
    expect(await listDecks("user_red", db)).toEqual([]);
    expect(
      await db.select().from(games).where(eq(games.deckId, deck.id)),
    ).toEqual([]);
  }));

test("deleteDeck leaves another user's deck alone", () =>
  withRollback(async (db) => {
    const deck = await createDeck({ userId: "user_blue", title: "Deck" }, db);

    expect(await deleteDeck({ userId: "user_red", deckId: deck.id }, db)).toBe(
      false,
    );
    expect(await listDecks("user_blue", db)).toEqual([{ ...deck, ...noGames }]);
  }));
