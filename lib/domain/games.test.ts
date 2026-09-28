import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "vitest";
import { withRollback } from "../../test/db";
import { archetypes } from "../db/schema";
import { createDeck, findDeck } from "./decks";
import {
  countGames,
  createGame,
  findGame,
  type Game,
  listGames,
  listMatchups,
} from "./games";

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

test("createGame stores the archetype the opponent most likely played", () =>
  withRollback(async (db) => {
    const deck = await createDeck({ userId: "user_red", title: "Deck" }, db);
    const deckOf = (name: string, playRates: Record<string, number>) => ({
      slug: name.toLowerCase().replaceAll(" ", "-"),
      name,
      share: 10,
      lists: 100,
      cards: [],
      pokemon: {},
      playRates,
    });
    await db.insert(archetypes).values([
      deckOf("Toxtricity Box", {
        Toxel: 100,
        Toxtricity: 100,
        "Darkness Energy": 100,
      }),
      deckOf("Dragapult ex", { Dreepy: 100, "Psychic Energy": 100 }),
    ]);
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
    const unsure = await createGame(
      { userId: "user_red", deckId: deck.id, log: "Turn 1" },
      db,
    );

    expect(game?.opponentArchetype).toBe("Toxtricity Box");
    expect(unsure?.opponentArchetype).toBeNull();
  }));

test("createGame stores the Signature Pokémon of the opponent's archetype", () =>
  withRollback(async (db) => {
    const deck = await createDeck({ userId: "user_red", title: "Deck" }, db);
    await db.insert(archetypes).values({
      slug: "toxtricity-box",
      name: "Toxtricity Box",
      share: 10,
      lists: 100,
      cards: [],
      pokemon: {},
      playRates: { Toxel: 100, Toxtricity: 100, "Darkness Energy": 100 },
      icons: ["toxtricity", "absol-mega"],
    });
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
    const unsure = await createGame(
      { userId: "user_red", deckId: deck.id, log: "Turn 1" },
      db,
    );

    expect(game?.opponentArchetypeIcons).toEqual(["toxtricity", "absol-mega"]);
    expect(unsure?.opponentArchetypeIcons).toBeNull();
  }));

test("createGame leaves the Signature Pokémon for later when the archetype has none yet", () =>
  withRollback(async (db) => {
    const deck = await createDeck({ userId: "user_red", title: "Deck" }, db);
    // Archetypes rebuilt before Signature Pokémon were stored have none.
    await db.insert(archetypes).values({
      slug: "toxtricity-box",
      name: "Toxtricity Box",
      share: 10,
      lists: 100,
      cards: [],
      pokemon: {},
      playRates: { Toxel: 100, Toxtricity: 100, "Darkness Energy": 100 },
    });
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

    expect(game?.opponentArchetype).toBe("Toxtricity Box");
    expect(game?.opponentArchetypeIcons).toBeNull();
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

// A filed game with only what listMatchups reads worth setting.
function gameOf(
  id: number,
  result: Game["result"],
  opponentArchetype: string | null,
  opponentArchetypeIcons: string[] | null = null,
): Game {
  return {
    id,
    deckId: 1,
    log: "",
    result,
    wonCoinToss: null,
    coinTossChoice: null,
    wentFirst: null,
    turnCount: null,
    opponentPokemon: null,
    opponentArchetype,
    opponentArchetypeIcons,
    maxDamage: null,
    opponentMaxDamage: null,
    language: null,
    createdAt: new Date(0),
  };
}

test("listMatchups groups games by the opponent's archetype, with each record", () => {
  const dragapultWin = gameOf(3, "win", "Dragapult Dusknoir");
  const gardevoirLoss = gameOf(2, "loss", "Gardevoir ex");
  const dragapultLoss = gameOf(1, "loss", "Dragapult Dusknoir");

  expect(
    listMatchups([dragapultWin, gardevoirLoss, dragapultLoss]),
  ).toMatchObject([
    {
      archetype: "Dragapult Dusknoir",
      wins: 1,
      losses: 1,
      games: [dragapultWin, dragapultLoss],
    },
    { archetype: "Gardevoir ex", wins: 0, losses: 1, games: [gardevoirLoss] },
  ]);
});

test("listMatchups puts the most played first, then the most recently played", () => {
  const matchups = listMatchups([
    gameOf(4, "win", "Gardevoir ex"),
    gameOf(3, "win", "Dragapult Dusknoir"),
    gameOf(2, "loss", "Dragapult Dusknoir"),
    gameOf(1, "loss", "Raging Bolt ex"),
  ]);

  expect(matchups.map((matchup) => matchup.archetype)).toEqual([
    "Dragapult Dusknoir",
    "Gardevoir ex",
    "Raging Bolt ex",
  ]);
});

test("listMatchups groups unknown and Other archetypes together, last", () => {
  const unknown = gameOf(4, "win", null);
  const other = gameOf(3, "loss", "Other", []);
  const unknownAgain = gameOf(2, null, null);

  expect(
    listMatchups([
      unknown,
      other,
      unknownAgain,
      gameOf(1, "win", "Gardevoir ex"),
    ]),
  ).toMatchObject([
    { archetype: "Gardevoir ex" },
    {
      archetype: null,
      signaturePokemon: null,
      wins: 1,
      losses: 1,
      games: [unknown, other, unknownAgain],
    },
  ]);
});

test("listMatchups shows an archetype by its newest game's Signature Pokémon", () => {
  expect(
    listMatchups([
      gameOf(2, "win", "Dragapult Dusknoir", ["dragapult", "dusknoir"]),
      gameOf(1, "win", "Dragapult Dusknoir", ["dragapult"]),
    ]),
  ).toMatchObject([{ signaturePokemon: ["dragapult", "dusknoir"] }]);
});
