import { and, count, desc, eq, getTableColumns } from "drizzle-orm";
import { db as defaultDb, type Db } from "../db";
import { decks, games } from "../db/schema";
import * as archetypes from "./archetypes";
import { findDeck } from "./decks";
import * as gameLog from "./game-log";
import type { Language } from "./log-check";

export type Game = typeof games.$inferSelect;

/**
 * Stores a game log on a user's deck, with the facts summarized from it.
 *
 * @param input - The Clerk user id, the deck id, the raw battle log, and the
 *   language Jev read it in, used only when the parser can't tell.
 * @param db - The database or a transaction; defaults to the shared client.
 * @returns The stored game, or undefined when the deck doesn't exist or
 *   belongs to someone else.
 */
export async function createGame(
  input: {
    userId: string;
    deckId: number;
    log: string;
    language?: Language | null;
  },
  db: Db = defaultDb,
): Promise<Game | undefined> {
  const deck = await findDeck(input, db);
  if (!deck) {
    return undefined;
  }

  const match = archetypes.findOpponentMatch(
    input.log,
    await archetypes.listCandidates(db),
  );
  const [game] = await db
    .insert(games)
    .values({
      deckId: deck.id,
      log: input.log,
      ...gameLog.summarize(input.log),
      // The parser knows the language for certain when it can read the log;
      // Jev's answer is for the languages it can't.
      language: gameLog.findLanguage(input.log) ?? input.language ?? null,
      opponentArchetype: match?.name ?? null,
      opponentArchetypeIcons: match?.signaturePokemon ?? null,
    })
    .returning();
  if (!game) {
    throw new Error("Insert returned no game");
  }
  return game;
}

/**
 * A single game, if the user owns the deck it belongs to.
 *
 * @param input - The Clerk user id and the game id.
 * @param db - The database or a transaction; defaults to the shared client.
 * @returns The game, or undefined when it doesn't exist or belongs to someone
 *   else.
 */
export async function findGame(
  input: { userId: string; gameId: number },
  db: Db = defaultDb,
): Promise<Game | undefined> {
  const [game] = await db
    .select(getTableColumns(games))
    .from(games)
    .innerJoin(decks, eq(games.deckId, decks.id))
    .where(and(eq(games.id, input.gameId), eq(decks.userId, input.userId)));
  return game;
}

/**
 * A user's games, on one deck or across all of them.
 *
 * @param input - The Clerk user id; optionally a deck id to keep to that deck,
 *   and a limit on how many to return.
 * @param db - The database or a transaction; defaults to the shared client.
 * @returns The games, newest first, or an empty array when there are none or
 *   the deck belongs to someone else.
 */
export async function listGames(
  input: { userId: string; deckId?: number; limit?: number },
  db: Db = defaultDb,
): Promise<Game[]> {
  const query = db
    .select(getTableColumns(games))
    .from(games)
    .innerJoin(decks, eq(games.deckId, decks.id))
    .where(
      and(
        eq(decks.userId, input.userId),
        input.deckId === undefined ? undefined : eq(games.deckId, input.deckId),
      ),
    )
    .orderBy(desc(games.id));
  return input.limit === undefined ? query : query.limit(input.limit);
}

/**
 * How many games a user has on one deck.
 *
 * @param input - The Clerk user id and the deck id.
 * @param db - The database or a transaction; defaults to the shared client.
 * @returns The number of games; 0 when the deck belongs to someone else.
 */
export async function countGames(
  input: { userId: string; deckId: number },
  db: Db = defaultDb,
): Promise<number> {
  const [row] = await db
    .select({ count: count() })
    .from(games)
    .innerJoin(decks, eq(games.deckId, decks.id))
    .where(and(eq(decks.userId, input.userId), eq(games.deckId, input.deckId)));
  return row?.count ?? 0;
}

/** The games a deck played against one Opponent Archetype, with its record. */
export type Matchup = {
  /** Null for games whose archetype is unknown or Limitless's "Other". */
  archetype: string | null;
  signaturePokemon: string[] | null;
  wins: number;
  losses: number;
  games: Game[];
};

/**
 * Groups a deck's games into Matchups, one per Opponent Archetype.
 *
 * @param games - The games, newest first, as listGames returns them.
 * @returns One Matchup per archetype, its games in the order given: the most
 *   played first, ties broken by the most recently played. Games whose
 *   archetype is unknown or "Other" share one Matchup, always last.
 * @example
 * listMatchups(await listGames({ userId, deckId }));
 * // [{ archetype: "Dragapult Dusknoir", wins: 3, losses: 1, … }, …]
 */
export function listMatchups(games: Game[]): Matchup[] {
  const matchups = new Map<string | null, Matchup>();
  for (const game of games) {
    // Neither an unknown archetype nor "Other" says what the opponent
    // played, so they're shown as one.
    const archetype =
      game.opponentArchetype === "Other" ? null : game.opponentArchetype;
    let matchup = matchups.get(archetype);
    if (!matchup) {
      matchup = {
        archetype,
        signaturePokemon: archetype ? game.opponentArchetypeIcons : null,
        wins: 0,
        losses: 0,
        games: [],
      };
      matchups.set(archetype, matchup);
    }
    matchup.games.push(game);
    if (game.result === "win") matchup.wins++;
    if (game.result === "loss") matchup.losses++;
  }
  // Maps keep the order each archetype was first seen, newest first, and the
  // sort is stable, so ties stay most recently played first.
  return [...matchups.values()].sort(
    (a, b) =>
      Number(a.archetype === null) - Number(b.archetype === null) ||
      b.games.length - a.games.length,
  );
}

/** The games a deck played on one calendar date, with its record. */
export type Day = {
  /** The date in the Viewer's timezone, as YYYY-MM-DD. */
  date: string;
  wins: number;
  losses: number;
  games: Game[];
};

/**
 * Groups a deck's games into Days, by the date each was filed. Logs carry no
 * date of their own, so filing is the nearest thing to when it was played.
 *
 * @param games - The games, newest first, as listGames returns them.
 * @param timeZone - The Viewer's IANA timezone, which decides where midnight
 *   falls.
 * @returns One Day per date, newest first, its games in the order given.
 * @example
 * listDays(await listGames({ userId, deckId }), "America/Mexico_City");
 * // [{ date: "2026-09-29", wins: 2, losses: 1, games: […] }, …]
 */
export function listDays(games: Game[], timeZone: string): Day[] {
  // en-CA writes dates as YYYY-MM-DD.
  const format = new Intl.DateTimeFormat("en-CA", { timeZone });
  const days = new Map<string, Day>();
  for (const game of games) {
    const date = format.format(game.createdAt);
    let day = days.get(date);
    if (!day) {
      day = { date, wins: 0, losses: 0, games: [] };
      days.set(date, day);
    }
    day.games.push(game);
    if (game.result === "win") day.wins++;
    if (game.result === "loss") day.losses++;
  }
  // YYYY-MM-DD sorts as text. Games usually come newest first already, but a
  // game filed late for an earlier day mustn't reorder the Days.
  return [...days.values()].sort((a, b) => b.date.localeCompare(a.date));
}
