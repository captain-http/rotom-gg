/**
 * Fetches one tournament page from pokemon.com and saves its HTML to
 * tournament_pages, or fails.
 *
 *     node scripts/fetch-tournament-page.ts [id]
 *
 * With no id it takes the one after the highest saved: 26-09-000041 is
 * followed by 26-09-000042. With an empty table it starts at FIRST_ID.
 *
 * pokemon.com sits behind Imperva, which turns away scripted requests, so the
 * page is fetched through ZenRows (https://docs.zenrows.com). Needs
 * ZENROWS_API_KEY; each page costs credits, more when ZenRows has to render
 * it or use premium proxies.
 */

import { desc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { ZenRows } from "zenrows";
import { tournamentPages } from "../lib/db/schema.ts";

const apiKey = process.env.ZENROWS_API_KEY;
if (!apiKey) throw new Error("ZENROWS_API_KEY is not set");
const zenrows = new ZenRows(apiKey);

// Its own connection rather than lib/db: that module is built for the Vercel
// runtime, and its imports don't carry the extensions a plain node run needs.
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle({ client: pool });

const URL =
  "https://www.pokemon.com/us/pokemon-trainer-club/play-pokemon-tournaments";
const FIRST_ID = "26-09-000001";

async function main() {
  const id = process.argv[2] ?? (await findNextId()) ?? FIRST_ID;
  if (!/^\d{2}-\d{2}-\d{6}$/.test(id)) {
    throw new Error(`${id}: not a tournament id, e.g. ${FIRST_ID}`);
  }

  console.log(`${id}: fetching`);
  const html = await fetchPage(id);
  await db
    .insert(tournamentPages)
    .values({ id, html })
    .onConflictDoUpdate({
      target: tournamentPages.id,
      set: { html, fetchedAt: sql`now()` },
    });
  console.log(`${id}: saved`);
}

/** The id after the highest saved one, or undefined when none are. */
async function findNextId(): Promise<string | undefined> {
  const [last] = await db
    .select({ id: tournamentPages.id })
    .from(tournamentPages)
    .orderBy(desc(tournamentPages.id))
    .limit(1);
  if (!last) return undefined;
  const [prefix, sequence] = [last.id.slice(0, 6), last.id.slice(6)];
  return prefix + String(Number(sequence) + 1).padStart(sequence.length, "0");
}

/** The page's HTML, or throws when it isn't this tournament's page. */
async function fetchPage(id: string): Promise<string> {
  // Adaptive mode starts with the cheapest request and escalates to
  // rendering or premium proxies only when the site needs it.
  const response = await zenrows.fetch(`${URL}/${id}`, {
    mode: "auto",
  });
  const html = await response.text();
  if (!response.ok) {
    throw new Error(`${id}: ZenRows ${response.status}: ${html.slice(0, 300)}`);
  }
  if (!html.includes(`data-tournament-id="${id}"`)) {
    throw new Error(
      `${id}: not a tournament page — blocked, or no such tournament`,
    );
  }
  return html;
}

try {
  await main();
} finally {
  await pool.end();
}
