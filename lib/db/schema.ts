import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  check,
  index,
  integer,
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
    // Parsed from the log (gameLog.summarize), from the viewer's point of view.
    // Null when the parser can't tell. Re-derivable from log at any time.
    result: text("result", { enum: ["win", "loss"] }),
    wonCoinToss: boolean("won_coin_toss"),
    // What the coin toss winner chose — the viewer or the opponent.
    coinTossChoice: text("coin_toss_choice", { enum: ["first", "second"] }),
    wentFirst: boolean("went_first"),
    // Each player's turn counts separately.
    turnCount: integer("turn_count"),
    // Pokémon the opponent put on the board, in order of first appearance.
    opponentPokemon: text("opponent_pokemon").array(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("games_deck_id_idx").on(table.deckId),
    check("games_result_check", sql`${table.result} in ('win', 'loss')`),
    check(
      "games_coin_toss_choice_check",
      sql`${table.coinTossChoice} in ('first', 'second')`,
    ),
  ],
);
