/**
 * Rebuilds the archetypes table: the deck archetypes of the current Standard
 * format, what a typical list of each contains, and how often each Pokémon
 * turns up in one.
 *
 *     node scripts/build-archetypes.ts
 *
 * Source is the Limitless API (https://docs.limitlesstcg.com/developer),
 * which labels every published decklist with the archetype its own site uses.
 * We don't invent archetypes — we mirror their taxonomy and work out what
 * each one looks like from the lists people actually registered.
 *
 * Reads a few thousand decklists and keeps none of them. Player names and
 * individual lists exist only for the length of the run; what's stored is
 * aggregate, because "95% of Dragapult lists run 1 Unfair Stamp" is the useful
 * part and "this person ran one" is somebody else's business.
 *
 * Rerun weekly-ish. The meta moves, and a stale table quietly starts telling
 * people they played against something they didn't.
 */

import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { archetypes, type ArchetypeCard } from "../lib/db/schema.ts";

// Its own connection rather than lib/db: that module is built for the Vercel
// runtime, and its imports don't carry the extensions a plain node run needs.
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle({ client: pool });

const API = "https://play.limitlesstcg.com/api";
// PTCGL logs are Standard, so the reference population should be too.
const FORMAT = "STANDARD";
// Small events rarely publish lists, and skew rogue when they do.
const MIN_PLAYERS = 32;
const TOURNAMENTS = 80;
// Below this an archetype has too few lists to describe honestly.
const MIN_LISTS = 5;
// Cards in fewer than this share of lists are that player's own tech.
const MIN_CARD_PCT = 10;
// Their API is free and anonymous; go gently and give up slowly.
const RETRIES = 5;
const PAUSE_MS = 250;

type Tournament = { id: string; format: string; players: number };
type Standing = {
  deck?: { id?: string; name?: string };
  decklist?: Record<
    string,
    { name: string; set: string; number: string; count: number }[]
  >;
};
type Entry = { slug: string; name: string; cards: Card[]; pokemon: Card[] };
type Card = { name: string; set: string; number: string; count: number };

async function main() {
  const tournaments = (
    await getJson<Tournament[]>(
      `${API}/tournaments?game=PTCG&limit=${TOURNAMENTS}`,
    )
  ).filter((t) => t.format === FORMAT && t.players >= MIN_PLAYERS);
  console.log(`Reading ${tournaments.length} tournaments…`);

  const entries: Entry[] = [];
  for (const tournament of tournaments) {
    const standings = await getJson<Standing[]>(
      `${API}/tournaments/${tournament.id}/standings`,
    );
    await sleep(PAUSE_MS);
    for (const standing of standings) {
      const entry = toEntry(standing);
      if (entry) entries.push(entry);
    }
  }
  if (entries.length === 0) {
    throw new Error("No labelled decklists found");
  }
  console.log(`${entries.length} labelled decklists.`);

  const rows = summarize(entries);
  await db.transaction(async (tx) => {
    // A rebuild replaces the format wholesale: archetypes die at rotation,
    // and nothing points at these rows.
    await tx.delete(archetypes);
    await tx.insert(archetypes).values(rows);
  });
  console.log(`Wrote ${rows.length} archetypes.`);
  await pool.end();
}

function toEntry(standing: Standing): Entry | undefined {
  const slug = standing.deck?.id;
  const name = standing.deck?.name;
  if (!slug || !name || !standing.decklist) return undefined;

  const cards = Object.values(standing.decklist)
    .flat()
    .filter((card) => card?.name);
  const pokemon = (standing.decklist.pokemon ?? []).filter(
    (card) => card?.name,
  );
  return cards.length > 0 ? { slug, name, cards, pokemon } : undefined;
}

function summarize(entries: Entry[]) {
  const grouped = new Map<string, Entry[]>();
  for (const entry of entries) {
    grouped.set(entry.slug, [...(grouped.get(entry.slug) ?? []), entry]);
  }

  const rows = [];
  for (const [slug, lists] of grouped) {
    if (lists.length < MIN_LISTS) continue;

    const counted = new Map<
      string,
      { card: Card; lists: number; counts: number[] }
    >();
    const pokemonLists = new Map<string, number>();
    for (const list of lists) {
      for (const card of list.cards) {
        const key = `${card.name}|${card.set}|${card.number}`;
        const entry = counted.get(key) ?? { card, lists: 0, counts: [] };
        entry.lists++;
        entry.counts.push(card.count);
        counted.set(key, entry);
      }
      // By name, because a battle log never says which printing it was.
      for (const name of new Set(list.pokemon.map((card) => card.name))) {
        pokemonLists.set(name, (pokemonLists.get(name) ?? 0) + 1);
      }
    }

    const cards: ArchetypeCard[] = [...counted.values()]
      .map((entry) => ({
        name: entry.card.name,
        set: entry.card.set,
        number: entry.card.number,
        pct: Math.round((entry.lists / lists.length) * 100),
        typical: median(entry.counts),
      }))
      .filter((card) => card.pct >= MIN_CARD_PCT)
      .sort((a, b) => b.pct - a.pct || a.name.localeCompare(b.name));

    const pokemon = Object.fromEntries(
      [...pokemonLists].map(([name, count]) => [
        name,
        Math.round((count / lists.length) * 100),
      ]),
    );

    rows.push({
      slug,
      name: lists[0]!.name,
      share: round((lists.length / entries.length) * 100),
      lists: lists.length,
      cards,
      pokemon,
      updatedAt: sql`now()`,
    });
  }
  return rows.sort((a, b) => b.lists - a.lists);
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function median(counts: number[]): number {
  const sorted = [...counts].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)]!;
}

// Limitless rate-limits anonymous callers, and a rebuild is a few hundred
// requests. Back off and retry rather than losing the whole run to one 429.
async function getJson<T>(url: string, attempt = 1): Promise<T> {
  const response = await fetch(url);
  if (response.status === 429 || response.status >= 500) {
    if (attempt > RETRIES) {
      throw new Error(`${url}: ${response.status} after ${RETRIES} retries`);
    }
    const after = Number(response.headers.get("retry-after"));
    const wait =
      Number.isFinite(after) && after > 0 ? after * 1000 : 2 ** attempt * 1000;
    console.log(`  ${response.status} — waiting ${Math.round(wait / 1000)}s`);
    await sleep(wait);
    return getJson<T>(url, attempt + 1);
  }
  if (!response.ok) throw new Error(`${url}: ${response.status}`);
  return (await response.json()) as T;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

await main();
