import { expect, test } from "vitest";
import { withRollback } from "../../test/db";
import { createDeck, listDecks } from "./decks";

test("createDeck stores the deck for the user", () =>
  withRollback(async (db) => {
    const deck = await createDeck(
      { userId: "user_red", title: "Gholdengo" },
      db,
    );

    expect(deck).toMatchObject({ userId: "user_red", title: "Gholdengo" });
    expect(await listDecks("user_red", db)).toEqual([deck]);
  }));

test("listDecks returns newest first", () =>
  withRollback(async (db) => {
    const first = await createDeck({ userId: "user_red", title: "First" }, db);
    const second = await createDeck(
      { userId: "user_red", title: "Second" },
      db,
    );

    expect(await listDecks("user_red", db)).toEqual([second, first]);
  }));

test("listDecks never returns another user's decks", () =>
  withRollback(async (db) => {
    await createDeck({ userId: "user_blue", title: "Not yours" }, db);

    expect(await listDecks("user_red", db)).toEqual([]);
  }));
