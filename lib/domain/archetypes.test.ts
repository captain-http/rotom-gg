import { expect, test } from "vitest";
import { archetypes as table } from "../db/schema";
import { withRollback } from "../../test/db";
import {
  findArchetypeByName,
  findMatch,
  listArchetypeNames,
  listArchetypes,
  listCandidates,
  type Archetype,
} from "./archetypes";

// Every deck runs these, so they tell no archetype from another.
const STAPLES = { "Ultra Ball": 100, "Boss's Orders": 100 };

function archetype(
  slug: string,
  share: number,
  pokemon: Record<string, number>,
  others: Record<string, number> = {},
): Archetype {
  return {
    slug,
    name: slug,
    share,
    lists: 100,
    cards: [],
    pokemon,
    playRates: { ...pokemon, ...STAPLES, ...others },
    icons: [slug],
    updatedAt: new Date(),
  };
}

// Two decks that share their basics and differ in what they evolve into.
const DRAGAPULT = archetype(
  "dragapult",
  12,
  { Dreepy: 100, Drakloak: 100, "Dragapult ex": 100, "Fezandipiti ex": 60 },
  { "Psychic Energy": 100, "Fire Energy": 5 },
);
const BLAZIKEN = {
  ...archetype(
    "dragapult-blaziken",
    3,
    { Dreepy: 100, Drakloak: 100, "Dragapult ex": 100, "Blaziken ex": 100 },
    { "Psychic Energy": 100, "Fire Energy": 100, "Magma Basin": 90 },
  ),
  icons: ["dragapult", "blaziken"],
};
const ZOROARK = archetype("zoroark", 7, {
  "N's Zorua": 100,
  "N's Zoroark ex": 100,
  "Fezandipiti ex": 70,
});
// Fezandipiti ex is the kind of card half the format plays — in the real
// table it turns up in 64 archetypes — so it has to identify nothing.
const SLOWKING = archetype("slowking", 5, {
  Slowpoke: 100,
  Slowking: 100,
  "Fezandipiti ex": 65,
});
const DHELMISE = archetype("dhelmise", 5, {
  Dhelmise: 100,
  "Fezandipiti ex": 60,
});
const CRUSTLE = archetype("crustle", 3, {
  Dwebble: 100,
  Crustle: 100,
  "Fezandipiti ex": 70,
});
const ALL = [DRAGAPULT, BLAZIKEN, ZOROARK, SLOWKING, DHELMISE, CRUSTLE];

test("findMatch picks the archetype the Pokémon belong to", () => {
  const match = findMatch(["N's Zorua", "N's Zoroark ex"], ALL);

  expect(match).toMatchObject({ slug: "zoroark", share: 7 });
  expect(match!.confidence).toBeGreaterThan(0.9);
});

test("findMatch separates two decks by the card that tells them apart", () => {
  const match = findMatch(["Dreepy", "Drakloak", "Blaziken ex"], ALL);

  expect(match?.slug).toBe("dragapult-blaziken");
});

test("findMatch gives the archetype's Signature Pokémon", () => {
  const match = findMatch(["Dreepy", "Drakloak", "Blaziken ex"], ALL);

  expect(match?.signaturePokemon).toEqual(["dragapult", "blaziken"]);
});

test("findMatch prefers the commoner deck when the Pokémon fit both", () => {
  // Both run all three, so only the share breaks the tie.
  const match = findMatch(["Dreepy", "Drakloak", "Dragapult ex"], ALL);

  expect(match?.slug).toBe("dragapult");
});

test("findMatch tells two decks apart by a Trainer only one plays", () => {
  const match = findMatch(["Dreepy", "Drakloak", "Magma Basin"], ALL);

  expect(match?.slug).toBe("dragapult-blaziken");
});

test("findMatch reads a log's Basic Energy as a decklist names it", () => {
  const match = findMatch(["Dreepy", "Basic Fire Energy"], ALL);

  expect(match?.slug).toBe("dragapult-blaziken");
});

test("findMatch learns nothing from staples every deck plays", () => {
  expect(
    findMatch(["Fezandipiti ex", "Ultra Ball", "Boss's Orders"], ALL),
  ).toEqual(findMatch(["Fezandipiti ex"], ALL));
});

test("findMatch gives up when a Pokémon could be almost anything", () => {
  expect(findMatch(["Fezandipiti ex"], ALL)).toBeUndefined();
});

test("findMatch returns undefined with nothing to go on", () => {
  expect(findMatch([], ALL)).toBeUndefined();
  expect(findMatch(["Dreepy"], [])).toBeUndefined();
});

test("findMatch lists what else it could have been", () => {
  const match = findMatch(["Dreepy", "Drakloak", "Dragapult ex"], ALL);

  expect(match!.alternatives[0]).toMatchObject({ slug: "dragapult-blaziken" });
  expect(match!.alternatives.map((a) => a.slug)).not.toContain(match!.slug);
});

test("findMatch ignores a Pokémon named twice", () => {
  const once = findMatch(["N's Zorua", "N's Zoroark ex"], ALL);
  const twice = findMatch(["N's Zorua", "N's Zorua", "N's Zoroark ex"], ALL);

  expect(twice).toEqual(once);
});

test("listArchetypes returns the commonest first", () =>
  withRollback(async (db) => {
    await db.insert(table).values([
      { ...ZOROARK, lists: 50 },
      { ...DRAGAPULT, lists: 300 },
    ]);

    expect((await listArchetypes(db)).map((a) => a.slug)).toEqual([
      "dragapult",
      "zoroark",
    ]);
  }));

test("listCandidates returns what findMatch scores, commonest first", () =>
  withRollback(async (db) => {
    await db.insert(table).values([
      { ...ZOROARK, lists: 50 },
      { ...DRAGAPULT, lists: 300 },
    ]);

    expect(await listCandidates(db)).toEqual([
      {
        slug: "dragapult",
        name: "dragapult",
        share: 12,
        playRates: DRAGAPULT.playRates,
        icons: ["dragapult"],
      },
      {
        slug: "zoroark",
        name: "zoroark",
        share: 7,
        playRates: ZOROARK.playRates,
        icons: ["zoroark"],
      },
    ]);
  }));

test("findArchetypeByName ignores capitalization", () =>
  withRollback(async (db) => {
    await db.insert(table).values(DRAGAPULT);

    expect(await findArchetypeByName("DRAGAPULT", db)).toMatchObject({
      slug: "dragapult",
    });
    expect(await findArchetypeByName("dragapult", db)).toMatchObject({
      slug: "dragapult",
    });
  }));

test("findArchetypeByName returns undefined for a deck that isn't there", () =>
  withRollback(async (db) => {
    expect(await findArchetypeByName("Wailord Mill", db)).toBeUndefined();
  }));

test("listArchetypeNames gives names and shares, commonest first", () =>
  withRollback(async (db) => {
    await db.insert(table).values([
      { ...ZOROARK, lists: 50 },
      { ...DRAGAPULT, lists: 300 },
    ]);

    expect(await listArchetypeNames(db)).toEqual([
      { name: "dragapult", share: 12 },
      { name: "zoroark", share: 7 },
    ]);
  }));
