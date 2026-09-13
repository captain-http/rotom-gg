import { sql } from "drizzle-orm";
import {
  bigint,
  check,
  index,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const decks = pgTable(
  "decks",
  {
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    // Clerk user id (e.g. "user_2abc..."). Clerk owns users, so no FK.
    userId: text("user_id").notNull(),
    title: text("title").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("decks_user_id_idx").on(table.userId)],
);

export const games = pgTable(
  "games",
  {
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    deckId: bigint("deck_id", { mode: "number" })
      .notNull()
      .references(() => decks.id, { onDelete: "cascade" }),
    // Raw battle log exactly as exported from Pokémon TCG Live.
    log: text("log").notNull(),
    // Parsed from the log, from the uploader's point of view. Null when the
    // parser can't tell. Re-derivable from log at any time.
    result: text("result", { enum: ["win", "loss"] }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("games_deck_id_idx").on(table.deckId),
    check("games_result_check", sql`${table.result} in ('win', 'loss')`),
  ],
);
