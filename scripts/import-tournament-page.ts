/**
 * Saves tournament pages from pokemon.com, fetched or saved by hand, to
 * tournament_pages. Each file must be one tournament's page, or the run
 * fails before saving any of them.
 *
 *     node scripts/import-tournament-page.ts page.html [more.html …]
 *     curl … | node scripts/import-tournament-page.ts
 *
 * The id comes from the page itself, not the file name. Importing a page
 * that's already saved overwrites it.
 */

import { readFile } from "node:fs/promises";
import { text } from "node:stream/consumers";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { tournamentPages } from "../lib/db/schema.ts";

// Its own connection rather than lib/db: that module is built for the Vercel
// runtime, and its imports don't carry the extensions a plain node run needs.
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle({ client: pool });

async function main() {
  const paths = process.argv.slice(2);
  const sources = paths.length
    ? await Promise.all(
        paths.map(async (path) => ({
          name: path,
          html: await readFile(path, "utf8"),
        })),
      )
    : [{ name: "stdin", html: await text(process.stdin) }];

  // Check every page before saving any, so a bad one fails the whole run.
  const pages = sources.map(({ name, html }) => ({
    id: getId(name, html),
    html,
  }));
  for (const { id, html } of pages) {
    await db
      .insert(tournamentPages)
      .values({ id, html })
      .onConflictDoUpdate({
        target: tournamentPages.id,
        set: { html, fetchedAt: sql`now()` },
      });
    console.log(`${id}: saved`);
  }
}

/** The tournament id a page shows, or throws when it isn't one's page. */
function getId(name: string, html: string): string {
  const id = html.match(/data-tournament-id="([^"]+)"/)?.[1];
  if (!id || !/^\d{2}-\d{2}-\d{6}$/.test(id)) {
    const blocked = html.includes("Incapsula") && html.length < 5000;
    throw new Error(
      `${name}: not a tournament page` + (blocked ? " (Incapsula block)" : ""),
    );
  }
  return id;
}

try {
  await main();
} finally {
  await pool.end();
}
