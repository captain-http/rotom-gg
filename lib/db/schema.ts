import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgTable,
  real,
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
    // Most damage from a single attack, Weakness included.
    maxDamage: integer("max_damage"),
    opponentMaxDamage: integer("opponent_max_damage"),
    // The language PTCGL wrote the log in, as TypeSafe's Jev read it when
    // the game was filed (logCheck.check). Null when Jev wasn't sure or
    // couldn't be asked.
    language: text("language", {
      enum: ["en", "fr", "de", "it", "es", "es-mx", "pt"],
    }),
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
    check(
      "games_language_check",
      sql`${table.language} in ('en', 'fr', 'de', 'it', 'es', 'es-mx', 'pt')`,
    ),
  ],
);

// Pokémon TCG deck archetypes, mirrored from Limitless, with what a typical
// list of each contains. Reference data: shared by everyone, owned by no
// user, and rebuilt in full by scripts/build-archetypes.ts.
export const archetypes = pgTable("archetypes", {
  // Limitless's own identifier, e.g. "excadrill-mega". Their key, not ours.
  slug: text("slug").primaryKey(),
  name: text("name").notNull(),
  // Share of the decklists the rebuild saw, as a percentage. Not whole: the
  // long tail of the format sits well under 1%.
  share: real("share").notNull(),
  // How many decklists the figures below were taken from.
  lists: integer("lists").notNull(),
  // [{ name, set, collectorNumber, playRate, copies }], commonest first.
  cards: jsonb("cards").$type<ArchetypeCard[]>().notNull(),
  // How often each Pokémon appears in a list, as a percentage, for
  // classifying an opponent from the few a battle log reveals:
  // { "Dreepy": 98, … }. Pokémon only — Trainers are too alike across decks
  // to tell archetypes apart, and a log names the Pokémon anyway.
  pokemon: jsonb("pokemon").$type<Record<string, number>>().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Tournament pages from pokemon.com, as fetched. Parsed offline later, once
// we've seen enough of them to know what to structure. Re-fetching a page
// overwrites it. The HTML includes the organizer's contact details, so never
// commit a page as a fixture without removing them.
export const tournamentPages = pgTable("tournament_pages", {
  // pokemon.com's id, e.g. "26-09-012234". Their key, not ours.
  id: text("id").primaryKey(),
  html: text("html").notNull(),
  fetchedAt: timestamp("fetched_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// People who asked to hear when rotom.gg opens, from the waitlist on "/".
// There is no Clerk user yet, so the address is the identity: one row each,
// and signing up twice changes nothing.
export const waitlist = pgTable("waitlist", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  // Trimmed and lowercased before it gets here, so the unique constraint
  // means what it looks like it means.
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/** One card in a typical list of an archetype. */
export type ArchetypeCard = {
  name: string;
  set: string;
  collectorNumber: string;
  /** Percentage of lists that ran it. */
  playRate: number;
  /** The usual number of copies. */
  copies: number;
};
