import { expect, test } from "vitest";
import cardNames from "./card-names.json";
import cardRules from "./card-rules.json";
import { findCard, findEnglishName, findPrinting, listCards } from "./cards";

// Read a real name out of the generated file rather than hard-coding one, so
// these keep passing after a rotation takes any particular card away.
const names = Object.keys(cardRules);
const [first, second] = names as [string, string];

test("findCard returns the card under its name", () => {
  const card = findCard(first);

  expect(card).toMatchObject({ name: first });
  expect(card?.printings.length).toBeGreaterThan(0);
});

test("findCard returns undefined for a name outside the format", () => {
  expect(findCard("Not A Real Card")).toBeUndefined();
});

test("listCards skips names the format doesn't have", () => {
  expect(listCards([first, "Not A Real Card", second])).toEqual([
    findCard(first),
    findCard(second),
  ]);
});

test("listCards returns a name asked for twice only once", () => {
  expect(listCards([first, first])).toEqual([findCard(first)]);
});

test("listCards returns an empty array when nothing is known", () => {
  expect(listCards(["Not A Real Card"])).toEqual([]);
});

test("every card has a known kind and at least one printing", () => {
  const kinds = new Set(["pokemon", "trainer", "energy"]);

  for (const name of names) {
    const card = findCard(name);
    expect(
      kinds.has(card!.category),
      `${name} has kind ${card!.category}`,
    ).toBe(true);
    expect(card!.printings.length, `${name} has no printings`).toBeGreaterThan(
      0,
    );
  }
});

test("findPrinting returns the version printed at that set and number", () => {
  const printing = findCard(first)!.printings.at(-1)!;
  const [set, number] = printing.prints[0]!.split(" ") as [string, string];

  expect(findPrinting(first, set, number)).toEqual(printing);
});

test("findPrinting ignores zero padding in the number", () => {
  const printing = findCard(first)!.printings[0]!;
  const [set, number] = printing.prints[0]!.split(" ") as [string, string];

  expect(findPrinting(first, set, number.padStart(3, "0"))).toEqual(printing);
});

test("findPrinting falls back to a card's only version", () => {
  const name = names.find((name) => findCard(name)!.printings.length === 1)!;

  expect(findPrinting(name, "XXX", "1")).toEqual(findCard(name)!.printings[0]);
});

test("findPrinting won't pick between versions the set doesn't name", () => {
  const name = names.find((name) => findCard(name)!.printings.length > 1)!;

  expect(findPrinting(name, "XXX", "1")).toBeUndefined();
});

test("findPrinting returns undefined for a name outside the format", () => {
  expect(findPrinting("Not A Real Card", "TWM", "1")).toBeUndefined();
});

test("only basic Energy is typed Normal", () => {
  for (const name of names) {
    const card = findCard(name)!;
    if (card.category !== "energy") continue;
    for (const printing of card.printings) {
      expect([name, printing.type]).toEqual([
        name,
        /^Basic .+ Energy$/.test(name) ? "Normal" : "Special",
      ]);
    }
  }
});

test("Tera marks some Pokémon and nothing else", () => {
  const tera = names.filter((name) =>
    findCard(name)!.printings.some((printing) => printing.tera),
  );

  expect(tera.length).toBeGreaterThan(0);
  expect(tera.every((name) => findCard(name)!.category === "pokemon")).toBe(
    true,
  );
});

test("findEnglishName translates a card named in another language", () => {
  const [localized, english] = Object.entries(cardNames.fr)[0]!;

  expect(findEnglishName(localized, "fr")).toBe(english);
});

test("findEnglishName returns a name the language doesn't translate", () => {
  expect(findEnglishName(first, "de")).toBe(first);
});

test("findEnglishName reads a curly apostrophe as a straight one", () => {
  const [localized, english] = Object.entries(cardNames.fr).find(([name]) =>
    name.includes("'"),
  )!;

  expect(findEnglishName(localized.replaceAll("'", "’"), "fr")).toBe(english);
});

test("findEnglishName falls back to Spain's Spanish for Latin America", () => {
  const [localized, english] = Object.entries(cardNames.es).find(
    ([name]) => !(name in cardNames["es-mx"]),
  )!;

  expect(findEnglishName(localized, "es-mx")).toBe(english);
});

test("findEnglishName returns undefined for a name outside the format", () => {
  expect(findEnglishName("Not A Real Card", "it")).toBeUndefined();
});

test("every translated name leads to a card in the format", () => {
  for (const [language, table] of Object.entries(cardNames)) {
    for (const [localized, english] of Object.entries(table)) {
      expect(findCard(english), `${language} ${localized}`).toBeDefined();
    }
  }
});
