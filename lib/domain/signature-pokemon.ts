// Limitless serves a sprite for each Signature Pokémon, named as
// archetypes.icons names them.
const LIMITLESS = "https://r2.limitlesstcg.net/pokemon/gen9";
// Served from public/: the one sprite that must always load.
const SUBSTITUTE = "/sprites/substitute.png";

/**
 * Where to load the sprites that show an archetype.
 *
 * @param signaturePokemon - The archetype's Signature Pokémon, as
 *   archetypes.icons names them, or null when no archetype was guessed.
 * @returns One image URL per Signature Pokémon, in order, or the Substitute
 *   alone when there are none.
 * @example
 * signaturePokemon.listSpriteUrls(["dragapult", "dusknoir"]);
 * // ["https://r2.limitlesstcg.net/pokemon/gen9/dragapult.png", …]
 */
export function listSpriteUrls(signaturePokemon: string[] | null): string[] {
  if (!signaturePokemon || signaturePokemon.length === 0) return [SUBSTITUTE];
  return signaturePokemon.map((icon) =>
    // Limitless shows its "Other" archetype by the Substitute, but has no
    // sprite of it.
    icon === "substitute" ? SUBSTITUTE : `${LIMITLESS}/${icon}.png`,
  );
}
