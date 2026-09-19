import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "vitest";
import { withRollback } from "../../test/db";
import { createDeck, findDeck } from "./decks";
import { countGames, createGame, findGame, listGames } from "./games";

test("createGame stores the log on the user's deck", () =>
  withRollback(async (db) => {
    const deck = await createDeck({ userId: "user_red", title: "Deck" }, db);

    const game = await createGame(
      { userId: "user_red", deckId: deck.id, log: "Turn 1" },
      db,
    );

    expect(game).toMatchObject({
      deckId: deck.id,
      log: "Turn 1",
      result: null,
    });
    expect(
      await listGames({ userId: "user_red", deckId: deck.id }, db),
    ).toEqual([game]);
  }));

test("createGame stores the facts summarized from the log", () =>
  withRollback(async (db) => {
    const deck = await createDeck({ userId: "user_red", title: "Deck" }, db);
    const log = readFileSync(
      join(
        import.meta.dirname,
        "../../test/fixtures/logs/win-bench-out-opponent-timeouts.txt",
      ),
      "utf8",
    );

    const game = await createGame(
      { userId: "user_red", deckId: deck.id, log },
      db,
    );

    expect(game).toMatchObject({
      result: "win",
      wonCoinToss: false,
      coinTossChoice: "first",
      wentFirst: false,
      turnCount: 8,
      opponentPokemon: ["Team Rocket's Sneasel", "Scraggy", "Toxel"],
      maxDamage: 260,
      opponentMaxDamage: 20,
    });
  }));

test("createGame stores the language the log is in", () =>
  withRollback(async (db) => {
    const deck = await createDeck({ userId: "user_red", title: "Deck" }, db);

    const game = await createGame(
      { userId: "user_red", deckId: deck.id, log: "Turn 1", language: "es" },
      db,
    );

    expect(game).toMatchObject({ language: "es" });
  }));

test("listGames returns newest first", () =>
  withRollback(async (db) => {
    const deck = await createDeck({ userId: "user_red", title: "Deck" }, db);
    const input = { userId: "user_red", deckId: deck.id };
    const first = await createGame({ ...input, log: "First" }, db);
    const second = await createGame({ ...input, log: "Second" }, db);

    expect(await listGames(input, db)).toEqual([second, first]);
  }));

test("listGames without a deck returns every deck's games, newest first", () =>
  withRollback(async (db) => {
    const one = await createDeck({ userId: "user_red", title: "One" }, db);
    const two = await createDeck({ userId: "user_red", title: "Two" }, db);
    const theirs = await createDeck({ userId: "user_blue", title: "No" }, db);
    const first = await createGame(
      { userId: "user_red", deckId: one.id, log: "First" },
      db,
    );
    const second = await createGame(
      { userId: "user_red", deckId: two.id, log: "Second" },
      db,
    );
    await createGame(
      { userId: "user_blue", deckId: theirs.id, log: "Theirs" },
      db,
    );

    expect(await listGames({ userId: "user_red" }, db)).toEqual([
      second,
      first,
    ]);
    expect(await listGames({ userId: "user_red", limit: 1 }, db)).toEqual([
      second,
    ]);
  }));

test("findGame returns the user's own game", () =>
  withRollback(async (db) => {
    const deck = await createDeck({ userId: "user_red", title: "Deck" }, db);
    const game = await createGame(
      { userId: "user_red", deckId: deck.id, log: "Mine" },
      db,
    );

    expect(
      await findGame({ userId: "user_red", gameId: game!.id }, db),
    ).toEqual(game);
  }));

test("findGame returns undefined for a game that doesn't exist", () =>
  withRollback(async (db) => {
    expect(
      await findGame({ userId: "user_red", gameId: 123456 }, db),
    ).toBeUndefined();
  }));

test("another user's deck can't be read or given games", () =>
  withRollback(async (db) => {
    const deck = await createDeck(
      { userId: "user_blue", title: "Not yours" },
      db,
    );
    await createGame(
      { userId: "user_blue", deckId: deck.id, log: "Theirs" },
      db,
    );
    const asRed = { userId: "user_red", deckId: deck.id };

    expect(await findDeck(asRed, db)).toBeUndefined();
    expect(await createGame({ ...asRed, log: "Mine" }, db)).toBeUndefined();
    expect(await listGames(asRed, db)).toEqual([]);
    expect(await countGames(asRed, db)).toBe(0);
    const theirs = await listGames(
      { userId: "user_blue", deckId: deck.id },
      db,
    );
    expect(
      await findGame({ userId: "user_red", gameId: theirs[0]!.id }, db),
    ).toBeUndefined();
    expect(
      await listGames({ userId: "user_blue", deckId: deck.id }, db),
    ).toHaveLength(1);
  }));

test("countGames counts the games on one deck", () =>
  withRollback(async (db) => {
    const deck = await createDeck({ userId: "user_red", title: "Deck" }, db);
    const other = await createDeck({ userId: "user_red", title: "Other" }, db);
    for (const deckId of [deck.id, deck.id, other.id]) {
      await createGame({ userId: "user_red", deckId, log: "Turn 1" }, db);
    }

    expect(await countGames({ userId: "user_red", deckId: deck.id }, db)).toBe(
      2,
    );
  }));
