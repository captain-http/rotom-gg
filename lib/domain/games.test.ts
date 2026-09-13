import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "vitest";
import { withRollback } from "../../test/db";
import { createDeck, getDeck } from "./decks";
import { createGame, listGames } from "./games";

test("createGame stores the log on the user's deck", () =>
  withRollback(async (db) => {
    const deck = await createDeck({ userId: "user_a", title: "Deck" }, db);

    const game = await createGame(
      { userId: "user_a", deckId: deck.id, log: "Turn 1" },
      db,
    );

    expect(game).toMatchObject({
      deckId: deck.id,
      log: "Turn 1",
      result: null,
    });
    expect(await listGames({ userId: "user_a", deckId: deck.id }, db)).toEqual([
      game,
    ]);
  }));

test("createGame stores the result parsed from the log", () =>
  withRollback(async (db) => {
    const deck = await createDeck({ userId: "user_a", title: "Deck" }, db);
    const log = readFileSync(
      join(
        import.meta.dirname,
        "../../test/fixtures/logs/win-bench-out-opponent-timeouts.txt",
      ),
      "utf8",
    );

    const game = await createGame(
      { userId: "user_a", deckId: deck.id, log },
      db,
    );

    expect(game?.result).toBe("win");
  }));

test("listGames returns newest first", () =>
  withRollback(async (db) => {
    const deck = await createDeck({ userId: "user_a", title: "Deck" }, db);
    const input = { userId: "user_a", deckId: deck.id };
    const first = await createGame({ ...input, log: "First" }, db);
    const second = await createGame({ ...input, log: "Second" }, db);

    expect(await listGames(input, db)).toEqual([second, first]);
  }));

test("another user's deck can't be read or given games", () =>
  withRollback(async (db) => {
    const deck = await createDeck({ userId: "user_b", title: "Not yours" }, db);
    await createGame({ userId: "user_b", deckId: deck.id, log: "Theirs" }, db);
    const asUserA = { userId: "user_a", deckId: deck.id };

    expect(await getDeck(asUserA, db)).toBeUndefined();
    expect(await createGame({ ...asUserA, log: "Mine" }, db)).toBeUndefined();
    expect(await listGames(asUserA, db)).toEqual([]);
    expect(
      await listGames({ userId: "user_b", deckId: deck.id }, db),
    ).toHaveLength(1);
  }));
