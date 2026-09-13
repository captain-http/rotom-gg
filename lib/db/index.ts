import { attachDatabasePool } from "@vercel/functions";
import { drizzle, type NodePgQueryResultHKT } from "drizzle-orm/node-postgres";
import type { PgDatabase } from "drizzle-orm/pg-core";
import { Pool } from "pg";
import * as schema from "./schema";

// The pooled URL on Vercel; migrations use the direct one (drizzle.config.ts).
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

export const pool = new Pool({ connectionString });
// Keeps a Vercel function alive until idle clients are released.
attachDatabasePool(pool);

export const db = drizzle({ client: pool, schema });

// The database or a transaction — domain functions accept either, so tests
// can run them inside a transaction that is rolled back.
export type Db = PgDatabase<NodePgQueryResultHKT, typeof schema>;
