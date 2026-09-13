import { defineConfig } from "drizzle-kit";

// Migrations need a direct connection; Neon's pooler is for the app runtime.
// Locally there is no pooler, so DATABASE_URL is the direct connection.
const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
if (!url) {
  throw new Error("DATABASE_URL_UNPOOLED or DATABASE_URL must be set");
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./lib/db/schema.ts",
  out: "./lib/db/migrations",
  dbCredentials: { url },
});
