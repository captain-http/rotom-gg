import { expect, test } from "vitest";
import { withRollback } from "../../test/db";
import { createDeck, listDecks } from "./decks";

test("createDeck stores the deck for the user", () =>
  withRollback(async (db) => {
    const deck = await createDeck({ userId: "user_a", title: "Gholdengo" }, db);

    expect(deck).toMatchObject({ userId: "user_a", title: "Gholdengo" });
    expect(await listDecks("user_a", db)).toEqual([deck]);
  }));

test("listDecks returns newest first", () =>
  withRollback(async (db) => {
    const first = await createDeck({ userId: "user_a", title: "First" }, db);
    const second = await createDeck({ userId: "user_a", title: "Second" }, db);

    expect(await listDecks("user_a", db)).toEqual([second, first]);
  }));

test("listDecks never returns another user's decks", () =>
  withRollback(async (db) => {
    await createDeck({ userId: "user_b", title: "Not yours" }, db);

    expect(await listDecks("user_a", db)).toEqual([]);
  }));
