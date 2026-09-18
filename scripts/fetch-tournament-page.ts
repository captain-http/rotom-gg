/**
 * Fetches one tournament page from pokemon.com and saves its HTML to
 * tournament_pages, or fails.
 *
 *     node scripts/fetch-tournament-page.ts [id]
 *
 * With no id it takes the one after the highest saved: 26-09-000041 is
 * followed by 26-09-000042. With an empty table it starts at FIRST_ID.
 *
 * pokemon.com sits behind Incapsula, which turns away scripted requests, so
 * this opens a visible Chrome window rather than a headless one. If a
 * challenge appears, solve it in the window; the script waits for the
 * tournament's details and saves them once they show. The profile persists
 * between runs, so a challenge passed once isn't asked again for a while.
 *
 * Needs a display (WSLg is enough) and Chrome, installed once with
 * `pnpm exec puppeteer browsers install chrome`.
 */

import { homedir } from "node:os";
import { join } from "node:path";
import { desc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import puppeteer from "puppeteer";
import { tournamentPages } from "../lib/db/schema.ts";

// Its own connection rather than lib/db: that module is built for the Vercel
// runtime, and its imports don't carry the extensions a plain node run needs.
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle({ client: pool });

const URL =
  "https://www.pokemon.com/us/pokemon-trainer-club/play-pokemon-tournaments";
const FIRST_ID = "26-09-000001";
// Long enough to solve a challenge by hand.
const TIMEOUT_MS = 120_000;
const PROFILE = join(homedir(), ".cache", "rotom-gg", "chrome-profile");

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

/** The page's HTML once it shows this tournament's details. */
async function fetchPage(id: string): Promise<string> {
  const browser = await puppeteer.launch({
    headless: false,
    userDataDir: PROFILE,
  });
  try {
    const page = await browser.newPage();
    await page.goto(`${URL}/${id}`, { timeout: TIMEOUT_MS });
    await page
      .waitForSelector(`#tournament_id[data-tournament-id="${id}"]`, {
        timeout: TIMEOUT_MS,
      })
      .catch(() => {
        throw new Error(
          `${id}: no tournament details after ${TIMEOUT_MS / 1000}s — ` +
            "blocked, or no such tournament",
        );
      });
    return await page.content();
  } finally {
    await browser.close();
  }
}

try {
  await main();
} finally {
  await pool.end();
}
