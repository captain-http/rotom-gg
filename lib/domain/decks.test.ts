import { expect, test } from "vitest";
import { withRollback } from "../../test/db";
import { games } from "../db/schema";
import { createDeck, listDecks } from "./decks";

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

test("listDecks counts wins and losses, skipping unknown results", () =>
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

    expect(await listDecks("user_red", db)).toEqual([
      { ...deck, wins: 2, losses: 1 },
    ]);
  }));

test("listDecks never returns another user's decks", () =>
  withRollback(async (db) => {
    await createDeck({ userId: "user_blue", title: "Not yours" }, db);

    expect(await listDecks("user_red", db)).toEqual([]);
  }));
