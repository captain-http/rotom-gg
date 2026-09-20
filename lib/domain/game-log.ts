/**
 * Facts read from a raw Pokémon TCG Live battle log.
 *
 * Import as a namespace: `import * as gameLog from "./game-log"`.
 * `get*` always returns a value; `find*` returns undefined when the log
 * doesn't say.
 */

import * as cards from "./cards";
import type { Language } from "./cards";

export type Result = "win" | "loss";
export type TurnOrder = "first" | "second";

/** Card names a player was seen with, by kind, in order of first appearance. */
export type Cards = {
  pokemon: string[];
  trainers: string[];
  energy: string[];
  // Names that aren't in the current format: rotated cards, a set newer
  // than card-rules.json, or a parser mistake.
  unknown: string[];
};

const KINDS = {
  pokemon: "pokemon",
  trainer: "trainers",
  energy: "energy",
} as const;

/**
 * The sentences Pokémon TCG Live writes for one language.
 *
 * Every pattern takes a player's name already escaped for a regular
 * expression, since the game writes most lines around it. English is the
 * only language here so far; each other one arrives with its fixture.
 */
type Phrases = {
  language: Language;
  /** "Red drew 7 cards for the opening hand." — captures the player. */
  openingHand: RegExp;
  /** "Red drew Lillie's Determination." — captures what was drawn. */
  drew: (p: string) => RegExp;
  /** What a draw says when it doesn't name the cards: "a card.", "3 cards". */
  unnamedDraw: RegExp;
  /** "Red wins.", after a reason on the same line or alone. */
  wins: (p: string) => RegExp;
  /** "Blue won the coin toss." */
  wonCoinToss: (p: string) => RegExp;
  /** "Blue decided to go first." — captures a word in turnOrder. */
  tossChoice: (p: string) => RegExp;
  /** The words that choice can use, as the game writes them. */
  turnOrder: Record<string, TurnOrder>;
  /** "Red's Turn" */
  turnHeader: (p: string) => RegExp;
  /** An attack that dealt damage — captures the amount. */
  attack: (p: string) => RegExp;
  /** Lines where a player acts with a Pokémon of their own. */
  playedPokemon: (p: string) => RegExp[];
  /** "- Red drew 2 cards and played them to the Bench." */
  benchedBySearch: (p: string) => RegExp;
  /** Lines that name a card of the player's, in any way. */
  cardLines: (p: string) => RegExp[];
  /** Whether a line is about this player: "Red played …", "Red's Lunatone …". */
  owns: (p: string) => RegExp;
};

const ENGLISH: Phrases = {
  language: "en",
  openingHand: /^(.+) drew 7 cards for the opening hand\.$/,
  drew: (p) => new RegExp(`^${p} drew (.+)$`),
  unnamedDraw: /^(?:a card\.|\d+ (?:more )?cards?\b)/,
  wins: (p) => new RegExp(`^(?:.+\\. )?${p} wins\\.$`),
  wonCoinToss: (p) => new RegExp(`^${p} won the coin toss\\.$`),
  tossChoice: (p) => new RegExp(`^${p} decided to go (first|second)\\.$`),
  turnOrder: { first: "first", second: "second" },
  turnHeader: (p) => new RegExp(`^${p}['’]s Turn$`),
  // Not anchored at the end: a Weakness note can follow on the same line.
  attack: (p) => new RegExp(`^${p}['’]s .+? used .+? for (\\d+) damage\\.`),
  playedPokemon: (p) => [
    new RegExp(`^${p} played (.+) to the (?:Active Spot|Bench)\\.$`),
    new RegExp(
      `^${p} evolved (.+?) to (.+?) (?:in the Active Spot|on the Bench)\\.$`,
    ),
    new RegExp(`^${p}['’]s (.+?) used `),
    new RegExp(`^${p}['’]s (.+) is now in the Active Spot\\.$`),
    new RegExp(`^${p}['’]s (.+) was Knocked Out!$`),
  ],
  benchedBySearch: (p) =>
    new RegExp(
      `^- ${p} drew \\d+ cards? and played (?:them|it) to the Bench\\.$`,
    ),
  cardLines: (p) => [
    // "Red drew Lillie's Determination." — not "drew a card"/"drew 3 cards".
    new RegExp(`^${p} drew (?!a card\\.)(?!\\d)(.+)\\.$`),
    new RegExp(`^${p} played (.+?)(?: to the (?:Active Spot|Bench))?\\.$`),
    new RegExp(`^${p} attached (.+?) to .+\\.$`),
    new RegExp(
      `^${p} evolved (.+?) to (.+?) (?:in the Active Spot|on the Bench)\\.$`,
    ),
    new RegExp(`^${p} discarded (?!\\d)(.+)\\.$`),
    new RegExp(`^(.+) was added to ${p}['’]s hand\\.$`),
    new RegExp(`^(.+) was discarded from ${p}['’]s .+\\.$`),
    new RegExp(`^${p}['’]s (.+?) used `),
    new RegExp(`^${p}['’]s (.+) is now in the Active Spot\\.$`),
    new RegExp(`^${p}['’]s (.+) was Knocked Out!$`),
  ],
  owns: (p) => new RegExp(`^${p} |^${p}['’]s |from ${p}['’]s `),
};

const PHRASES: Phrases[] = [ENGLISH];

/**
 * The language a log is written in, from the sentences the game used.
 *
 * @param log - The raw battle log.
 * @returns The language, or undefined when no language's opening-hand line
 *   matches — an empty log, or one in a language the parser can't read yet.
 * @example
 * gameLog.findLanguage(log); // "en"
 */
export function findLanguage(log: string): Language | undefined {
  return findPhrases(log)?.language;
}

function findPhrases(log: string): Phrases | undefined {
  return PHRASES.find((phrases) =>
    lines(log).some((line) => phrases.openingHand.test(line)),
  );
}

/** The columns stored on a game, from the viewer's point of view. */
export type Summary = {
  language: Language | null;
  result: Result | null;
  wonCoinToss: boolean | null;
  coinTossChoice: TurnOrder | null;
  wentFirst: boolean | null;
  turnCount: number | null;
  opponentPokemon: string[] | null;
  maxDamage: number | null;
  opponentMaxDamage: number | null;
};

/**
 * The columns stored on a game for its log.
 *
 * @param log - The raw battle log.
 * @returns The stored facts, with null for anything the log doesn't say.
 * @example
 * gameLog.summarize(log);
 * // { language: "en", result: "win", wonCoinToss: false, coinTossChoice: "first",
 * //   wentFirst: false,
 * //   turnCount: 8, opponentPokemon: ["Team Rocket's Sneasel", "Scraggy", "Toxel"],
 * //   maxDamage: 260, opponentMaxDamage: 20 }
 */
export function summarize(log: string): Summary {
  const viewer = findViewer(log);
  const isViewer = (player: string | undefined) =>
    viewer && player ? player === viewer : null;

  return {
    language: findLanguage(log) ?? null,
    result: findResult(log) ?? null,
    wonCoinToss: isViewer(findCoinTossWinner(log)),
    coinTossChoice: findCoinTossChoice(log) ?? null,
    wentFirst: isViewer(findStartingPlayer(log)),
    turnCount: findTurnCount(log) ?? null,
    opponentPokemon: viewer ? listOpponentPlayedPokemon(log) : null,
    maxDamage: findViewerMaxDamage(log) ?? null,
    opponentMaxDamage: findOpponentMaxDamage(log) ?? null,
  };
}

/**
 * The names of the players, read from their opening-hand draws
 * ("Red drew 7 cards for the opening hand.").
 *
 * @param log - The raw battle log.
 * @returns Player names in the order they drew, or an empty array.
 * @example
 * gameLog.getPlayers(log); // ["Red", "Blue"]
 */
export function getPlayers(log: string): string[] {
  const phrases = findPhrases(log);
  if (!phrases) {
    return [];
  }
  return lines(log).flatMap((line) => {
    const match = line.match(phrases.openingHand);
    return match?.[1] ? [match[1]] : [];
  });
}

/**
 * The player who exported the log.
 *
 * The log never says who that is, but it only names the cards they draw:
 * "Red drew Lillie's Determination." against "Blue drew a card."
 *
 * @param log - The raw battle log.
 * @returns The one player with named draws, or undefined when zero or both do.
 * @example
 * gameLog.findViewer(log); // "Red"
 */
export function findViewer(log: string): string | undefined {
  const phrases = findPhrases(log);
  if (!phrases) {
    return undefined;
  }
  const withNamedDraws = getPlayers(log).filter((player) => {
    const drew = phrases.drew(escapeRegExp(player));
    return lines(log).some((line) => {
      const drawn = line.match(drew)?.[1];
      return drawn !== undefined && !phrases.unnamedDraw.test(drawn);
    });
  });
  return withNamedDraws.length === 1 ? withNamedDraws[0] : undefined;
}

/**
 * The player who won, from a "<player> wins." line, which may follow the
 * reason ("No Benched Pokémon for backup. Red wins.").
 *
 * @param log - The raw battle log.
 * @returns The winner's name, or undefined when the log has no winner.
 * @example
 * gameLog.findWinner(log); // "Red"
 */
export function findWinner(log: string): string | undefined {
  const phrases = findPhrases(log);
  return getPlayers(log).find((player) => {
    const wins = phrases?.wins(escapeRegExp(player));
    return wins && lines(log).some((line) => wins.test(line));
  });
}

/**
 * The player who won the opening coin toss, from "<player> won the coin toss."
 *
 * @param log - The raw battle log.
 * @returns The toss winner's name, or undefined when the log doesn't say.
 * @example
 * gameLog.findCoinTossWinner(log); // "Blue"
 */
export function findCoinTossWinner(log: string): string | undefined {
  const phrases = findPhrases(log);
  return getPlayers(log).find((player) => {
    const won = phrases?.wonCoinToss(escapeRegExp(player));
    return won && lines(log).some((line) => won.test(line));
  });
}

/**
 * What the coin toss winner chose, from "<player> decided to go first."
 *
 * "decided to go second." is assumed to mirror it; no real log has shown
 * that wording yet.
 *
 * @param log - The raw battle log.
 * @returns "first" or "second", or undefined when the log doesn't say.
 * @example
 * gameLog.findCoinTossChoice(log); // "first"
 */
export function findCoinTossChoice(log: string): TurnOrder | undefined {
  const phrases = findPhrases(log);
  const tossWinner = findCoinTossWinner(log);
  if (!phrases || !tossWinner) {
    return undefined;
  }
  const choice = phrases.tossChoice(escapeRegExp(tossWinner));
  const word = lines(log).flatMap((line) => line.match(choice)?.[1] ?? [])[0];
  return word === undefined ? undefined : phrases.turnOrder[word];
}

/**
 * The player who took the first turn: the coin toss winner if they chose to
 * go first, otherwise the other player.
 *
 * @param log - The raw battle log.
 * @returns The starting player's name, or undefined when the toss winner or
 *   their choice can't be found.
 * @example
 * gameLog.findStartingPlayer(log); // "Blue"
 */
export function findStartingPlayer(log: string): string | undefined {
  const tossWinner = findCoinTossWinner(log);
  const choice = findCoinTossChoice(log);
  if (!tossWinner || !choice) {
    return undefined;
  }
  if (choice === "first") {
    return tossWinner;
  }
  const others = getPlayers(log).filter((player) => player !== tossWinner);
  return others.length === 1 ? others[0] : undefined;
}

/**
 * How many turns the game took, counting each player's turn separately (as
 * the game rules do), from the "<player>'s Turn" headers. Setup isn't a turn.
 *
 * @param log - The raw battle log.
 * @returns The number of turns, or undefined when the log has no turn headers.
 * @example
 * gameLog.findTurnCount(log); // 8
 */
export function findTurnCount(log: string): number | undefined {
  const phrases = findPhrases(log);
  if (!phrases) {
    return undefined;
  }
  const headers = getPlayers(log).map((player) =>
    phrases.turnHeader(escapeRegExp(player)),
  );
  const count = lines(log).filter((line) =>
    headers.some((header) => header.test(line)),
  ).length;
  return count > 0 ? count : undefined;
}

/**
 * Whether the viewer won or lost.
 *
 * @param log - The raw battle log.
 * @returns "win" or "loss" from the viewer's side, or undefined when either
 *   the viewer or the winner can't be found.
 * @example
 * gameLog.findResult(log); // "win"
 */
export function findResult(log: string): Result | undefined {
  const viewer = findViewer(log);
  const winner = findWinner(log);
  if (!viewer || !winner) {
    return undefined;
  }
  return winner === viewer ? "win" : "loss";
}

/**
 * The Pokémon the viewer put on the board.
 *
 * @remarks
 * Only Pokémon that reached the board. Cards the log reveals but that were
 * never played — the opening hand, draws, discards, shuffles — aren't
 * included — `getViewerCards` sorts those by kind. In the
 * fixture, Hariyama is drawn but never played, so it isn't listed here.
 *
 * @param log - The raw battle log.
 * @returns Pokémon names in order of first appearance, or an empty array when
 *   the viewer can't be found. See `listPlayedPokemon` for what counts.
 * @example
 * gameLog.listViewerPlayedPokemon(log);
 * // ["Makuhita", "Lunatone", "Solrock", "Riolu", "Mega Lucario ex", "Meowth ex"]
 */
export function listViewerPlayedPokemon(log: string): string[] {
  const viewer = findViewer(log);
  return viewer ? listPlayedPokemon(log, viewer) : [];
}

/**
 * The Pokémon the opponent put on the board — the only ones the log reveals
 * for certain, since their hand and deck stay hidden.
 *
 * @remarks
 * Only Pokémon that reached the board. Cards revealed but never played —
 * a mulligan reveal, a searched card like Dusk Ball's — aren't included;
 * `getOpponentCards` covers those. In the fixture, Toxtricity is revealed by
 * the mulligan and drawn by Dusk Ball but never played, so it isn't listed.
 *
 * @param log - The raw battle log.
 * @returns Pokémon names in order of first appearance, or an empty array when
 *   the viewer, and so the opponent, can't be found.
 * @example
 * gameLog.listOpponentPlayedPokemon(log);
 * // ["Team Rocket's Sneasel", "Scraggy", "Toxel"]
 */
export function listOpponentPlayedPokemon(log: string): string[] {
  const opponent = findOpponent(log);
  return opponent ? listPlayedPokemon(log, opponent) : [];
}

/**
 * The most damage the viewer dealt with a single attack.
 *
 * @remarks
 * Reads "<player>'s <Pokémon> used <attack> on <target> for <N> damage.",
 * where N already includes Weakness and Resistance. Damage counters placed
 * by effects ("put 4 damage counters on …") aren't attacks and don't count.
 *
 * @param log - The raw battle log.
 * @returns The highest damage, or undefined when the viewer can't be found or
 *   never dealt attack damage.
 * @example
 * gameLog.findViewerMaxDamage(log); // 260
 */
export function findViewerMaxDamage(log: string): number | undefined {
  const viewer = findViewer(log);
  return viewer ? findMaxDamage(log, viewer) : undefined;
}

/**
 * The most damage the opponent dealt with a single attack.
 *
 * @remarks
 * Same rules as `findViewerMaxDamage`.
 *
 * @param log - The raw battle log.
 * @returns The highest damage, or undefined when the opponent can't be found
 *   or never dealt attack damage.
 * @example
 * gameLog.findOpponentMaxDamage(log); // 20
 */
export function findOpponentMaxDamage(log: string): number | undefined {
  const opponent = findOpponent(log);
  return opponent ? findMaxDamage(log, opponent) : undefined;
}

// The player who isn't the viewer.
function findOpponent(log: string): string | undefined {
  const viewer = findViewer(log);
  const others = getPlayers(log).filter((player) => player !== viewer);
  return viewer && others.length === 1 ? others[0] : undefined;
}

function findMaxDamage(log: string, player: string): number | undefined {
  const phrases = findPhrases(log);
  if (!phrases) {
    return undefined;
  }
  const attack = phrases.attack(escapeRegExp(player));
  const damages = lines(log).flatMap((line) => {
    const damage = line.match(attack)?.[1];
    return damage ? [Number(damage)] : [];
  });
  return damages.length > 0 ? Math.max(...damages) : undefined;
}

// A player's Pokémon, from lines where that player acts with their own
// Pokémon: played to the Active Spot or Bench, benched by a search card,
// evolved, used an attack or ability, promoted, or Knocked Out. Damage
// targets ("on Blue’s Toxel") are skipped: the game sometimes names the wrong
// owner there ("Red put 4 damage counters on Blue's Mega Lucario ex").
function listPlayedPokemon(log: string, player: string): string[] {
  const phrases = findPhrases(log);
  if (!phrases) {
    return [];
  }
  const p = escapeRegExp(player);
  const patterns = phrases.playedPokemon(p);
  const benchedBySearch = phrases.benchedBySearch(p);

  const found = new Set<string>();
  const all = lines(log);
  all.forEach((line, index) => {
    for (const pattern of patterns) {
      const match = line.match(pattern);
      match?.slice(1).forEach((name) => found.add(name));
    }
    // The benched Pokémon are listed on the next line: "   • Scraggy, Toxel".
    if (benchedBySearch.test(line)) {
      const names = all[index + 1]?.match(/^\s+• (.+)$/)?.[1];
      names?.split(", ").forEach((name) => found.add(name));
    }
  });
  return [...found];
}

/**
 * Every card the log shows the viewer with, played or only revealed, sorted
 * into kinds with the current format's cards.
 *
 * @remarks
 * Reads cards the viewer drew by name, played, attached, evolved, discarded,
 * took as a Prize, or had revealed in a list (opening hand, draws, shuffles,
 * discards). Cards are sorted with `cards.findCard`, which only knows the
 * current Standard format. A name it doesn't have — a rotated card, a set
 * newer than card-rules.json, or a parser mistake — lands in `unknown` rather
 * than being dropped. Basic Energy isn't in the format's cards (it has no
 * text), so any other name ending in " Energy" is sorted as Energy.
 *
 * @param log - The raw battle log.
 * @returns Names per kind in order of first appearance; all empty when the
 *   viewer can't be found.
 * @example
 * gameLog.getViewerCards(log).trainers;
 * // ["Switch", "Poké Pad", "Premium Power Pro", "Boss's Orders", …]
 */
export function getViewerCards(log: string): Cards {
  const viewer = findViewer(log);
  return viewer ? getCards(log, viewer) : sortCards([]);
}

/**
 * Every card the log shows the opponent with, played or only revealed.
 *
 * @remarks
 * Same rules as `getViewerCards`. The opponent's hand stays hidden, so this
 * is what they played plus what effects revealed: a mulligan, a searched
 * card, discards. In the fixture, Toxtricity comes from the mulligan reveal
 * and Dusk Ball, though it never reached the board.
 *
 * @param log - The raw battle log.
 * @returns Names per kind in order of first appearance; all empty when the
 *   opponent can't be found.
 * @example
 * gameLog.getOpponentCards(log).pokemon;
 * // ["Toxtricity", "Team Rocket's Sneasel", "Scraggy", "Toxel"]
 */
export function getOpponentCards(log: string): Cards {
  const opponent = findOpponent(log);
  return opponent ? getCards(log, opponent) : sortCards([]);
}

function getCards(log: string, player: string): Cards {
  const phrases = findPhrases(log);
  if (!phrases) {
    return sortCards([]);
  }
  const players = getPlayers(log);
  const single = phrases.cardLines(escapeRegExp(player));

  // Whose line this is: "Red played …", "Red's Lunatone …", or "… from Red's".
  const owners = players.map((name) => ({
    name,
    owns: phrases.owns(escapeRegExp(name)),
  }));
  const ownerOf = (text: string) =>
    owners.find((owner) => owner.owns.test(text))?.name;

  const names: string[] = [];
  let topOwner: string | undefined;
  let subOwner: string | undefined;
  let subText = "";
  for (const line of lines(log)) {
    const bullet = line.match(/^\s+• (.+)$/)?.[1];
    if (bullet !== undefined) {
      // A list belongs to the line above it ("- Red drew 8 cards."), or to
      // the turn line above that ("Blue took a mulligan." over "- Cards
      // revealed from Mulligan 1"). A damage breakdown isn't a card list.
      const owner = subOwner ?? topOwner;
      if (owner === player && !subText.endsWith("breakdown:")) {
        names.push(...bullet.split(", "));
      }
      continue;
    }

    const sub = line.match(/^- (.+)$/)?.[1];
    const text = sub ?? line;
    if (sub === undefined) {
      topOwner = ownerOf(text);
      subOwner = undefined;
      subText = "";
    } else {
      subOwner = ownerOf(text);
      subText = text;
    }
    for (const pattern of single) {
      names.push(...(text.match(pattern)?.slice(1) ?? []));
    }
  }
  return sortCards(names);
}

function sortCards(names: string[]): Cards {
  const sorted: Cards = { pokemon: [], trainers: [], energy: [], unknown: [] };
  for (const name of new Set(names)) {
    const card = cards.findCard(name.replaceAll("’", "'"));
    const kind = card
      ? KINDS[card.category]
      : name.endsWith(" Energy")
        ? "energy"
        : "unknown";
    sorted[kind].push(name);
  }
  return sorted;
}

// Player names go into the patterns above, and usernames can contain
// characters that mean something in a regular expression: "Red.Blue" would
// match "RedXBlue", and "Red(1)" wouldn't compile. The character class lists
// every such character — . * + ? ^ $ { } ( ) | [ ] \ — and "\\$&" puts a
// backslash before each match ($& is the matched character), so the name is
// matched literally.
function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function lines(log: string): string[] {
  return log.split(/\r?\n/);
}
