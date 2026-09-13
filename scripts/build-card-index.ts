/**
 * Regenerates lib/domain/card-index.json: every Pokémon TCG card name and what
 * kind of card it is, from TCGdex (MIT, https://github.com/tcgdex/cards-database).
 *
 *     node scripts/build-card-index.ts
 *
 * Rerun when a new set releases. Battle logs name cards but never say what
 * they are, so the parser looks names up here to tell a revealed Pokémon from
 * a Trainer. Keyed by name, not printing: every printing of a name is the same
 * kind of card (the script fails if that ever stops being true).
 */

import { writeFileSync } from "node:fs";

const API = "https://api.tcgdex.net/v2";
const OUT = new URL("../lib/domain/card-index.json", import.meta.url);

type ApiCard = {
  name: string;
  category: "Pokemon" | "Trainer" | "Energy";
  trainerType: string | null;
  energyType: string | null;
  stage: string | null;
  set: { id: string };
};

type CardEntry = {
  category: "pokemon" | "trainer" | "energy";
  // Trainer: Item, Supporter, Stadium, Tool. Energy: Normal, Special.
  // Pokémon: Basic, Stage1, Stage2, …
  type: string | null;
};

async function main() {
  // TCG Pocket is a different game; its cards never appear in TCG Live logs.
  const pocket = await getJson<{ sets: { id: string }[] }>(
    `${API}/en/series/tcgp`,
  );
  const pocketSets = new Set(pocket.sets.map((set) => set.id));

  const { data, errors } = await postGraphql<{ cards: ApiCard[] }>(
    `{ cards { name category trainerType energyType stage set { id } } }`,
  );
  if (errors?.length || !data) {
    throw new Error(`TCGdex query failed: ${JSON.stringify(errors)}`);
  }

  const index = new Map<string, CardEntry>();
  const conflicts: string[] = [];
  for (const card of data.cards) {
    if (pocketSets.has(card.set.id)) continue;

    const entry: CardEntry = {
      category: card.category.toLowerCase() as CardEntry["category"],
      type: card.trainerType ?? card.energyType ?? card.stage,
    };
    const previous = index.get(card.name);
    if (previous && previous.category !== entry.category) {
      conflicts.push(card.name);
    }
    // Keep the first type seen; a missing type is filled by a later printing.
    if (!previous || (!previous.type && entry.type)) {
      index.set(card.name, entry);
    }
  }
  if (conflicts.length > 0) {
    throw new Error(`Names printed as different kinds: ${conflicts}`);
  }

  const sorted = Object.fromEntries(
    [...index].sort(([a], [b]) => a.localeCompare(b)),
  );
  writeFileSync(OUT, `${JSON.stringify(sorted, null, 2)}\n`);
  console.log(`Wrote ${index.size} card names to ${OUT.pathname}`);
}

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url}: ${response.status}`);
  return (await response.json()) as T;
}

async function postGraphql<T>(
  query: string,
): Promise<{ data?: T; errors?: unknown[] }> {
  const response = await fetch(`${API}/graphql`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query }),
  });
  if (!response.ok) throw new Error(`GraphQL: ${response.status}`);
  return (await response.json()) as { data?: T; errors?: unknown[] };
}

await main();
