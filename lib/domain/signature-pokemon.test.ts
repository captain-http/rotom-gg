import { expect, test } from "vitest";
import * as signaturePokemon from "./signature-pokemon";

test("listSpriteUrls gives each Signature Pokémon's sprite on Limitless", () => {
  expect(signaturePokemon.listSpriteUrls(["dragapult", "dusknoir"])).toEqual([
    "https://r2.limitlesstcg.net/pokemon/gen9/dragapult.png",
    "https://r2.limitlesstcg.net/pokemon/gen9/dusknoir.png",
  ]);
});

test("listSpriteUrls stands the Substitute in for an archetype never guessed", () => {
  expect(signaturePokemon.listSpriteUrls(null)).toEqual([
    "/sprites/substitute.png",
  ]);
  expect(signaturePokemon.listSpriteUrls([])).toEqual([
    "/sprites/substitute.png",
  ]);
});

test("listSpriteUrls serves Limitless's Other archetype the Substitute itself", () => {
  // Limitless names it but has no sprite for it.
  expect(signaturePokemon.listSpriteUrls(["substitute"])).toEqual([
    "/sprites/substitute.png",
  ]);
});
