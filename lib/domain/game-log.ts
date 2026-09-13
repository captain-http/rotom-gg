/**
 * Facts read from a raw Pokémon TCG Live battle log.
 *
 * Import as a namespace: `import * as gameLog from "./game-log"`.
 * `get*` always returns a value; `find*` returns undefined when the log
 * doesn't say.
 */

export type Result = "win" | "loss";
export type TurnOrder = "first" | "second";

/** The columns stored on a game, from the viewer's point of view. */
export type Summary = {
  result: Result | null;
  wonCoinToss: boolean | null;
  coinTossChoice: TurnOrder | null;
  wentFirst: boolean | null;
  turnCount: number | null;
  opponentPokemon: string[] | null;
};

/**
 * The columns stored on a game for its log.
 *
 * @param log - The raw battle log.
 * @returns The stored facts, with null for anything the log doesn't say.
 * @example
 * gameLog.summarize(log);
 * // { result: "win", wonCoinToss: false, coinTossChoice: "first", wentFirst: false,
 * //   turnCount: 8, opponentPokemon: ["Team Rocket's Sneasel", "Scraggy", "Toxel"] }
 */
export function summarize(log: string): Summary {
  const viewer = findViewer(log);
  const isViewer = (player: string | undefined) =>
    viewer && player ? player === viewer : null;

  return {
    result: findResult(log) ?? null,
    wonCoinToss: isViewer(findCoinTossWinner(log)),
    coinTossChoice: findCoinTossChoice(log) ?? null,
    wentFirst: isViewer(findStartingPlayer(log)),
    turnCount: findTurnCount(log) ?? null,
    opponentPokemon: viewer ? listOpponentPlayedPokemon(log) : null,
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
  return lines(log).flatMap((line) => {
    const match = line.match(/^(.+) drew 7 cards for the opening hand\.$/);
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
  const withNamedDraws = getPlayers(log).filter((player) =>
    lines(log).some((line) => {
      if (!line.startsWith(`${player} drew `)) {
        return false;
      }
      const drawn = line.slice(`${player} drew `.length);
      return drawn !== "a card." && !/^\d+ (more )?cards?\b/.test(drawn);
    }),
  );
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
  return getPlayers(log).find((player) =>
    lines(log).some(
      (line) =>
        line === `${player} wins.` || line.endsWith(`. ${player} wins.`),
    ),
  );
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
  return getPlayers(log).find((player) =>
    lines(log).includes(`${player} won the coin toss.`),
  );
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
  const tossWinner = findCoinTossWinner(log);
  if (!tossWinner) {
    return undefined;
  }
  const line = lines(log).find((line) =>
    line.startsWith(`${tossWinner} decided to go `),
  );
  const match = line?.match(/ decided to go (first|second)\.$/);
  return match?.[1] as TurnOrder | undefined;
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
  const headers = getPlayers(log).flatMap((player) => [
    `${player}'s Turn`,
    `${player}’s Turn`,
  ]);
  const count = lines(log).filter((line) => headers.includes(line)).length;
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
 * @param log - The raw battle log.
 * @returns Pokémon names in order of first appearance, or an empty array when
 *   the viewer, and so the opponent, can't be found.
 * @example
 * gameLog.listOpponentPlayedPokemon(log);
 * // ["Team Rocket's Sneasel", "Scraggy", "Toxel"]
 */
export function listOpponentPlayedPokemon(log: string): string[] {
  const viewer = findViewer(log);
  const others = getPlayers(log).filter((player) => player !== viewer);
  return viewer && others.length === 1 && others[0]
    ? listPlayedPokemon(log, others[0])
    : [];
}

// A player's Pokémon, from lines where that player acts with their own
// Pokémon: played to the Active Spot or Bench, benched by a search card,
// evolved, used an attack or ability, promoted, or Knocked Out. Damage
// targets ("on Blue’s Toxel") are skipped: the game sometimes names the wrong
// owner there ("Red put 4 damage counters on Blue's Mega Lucario ex").
function listPlayedPokemon(log: string, player: string): string[] {
  const p = escapeRegExp(player);
  const own = `${p}['’]s `;
  const patterns = [
    new RegExp(`^${p} played (.+) to the (?:Active Spot|Bench)\\.$`),
    new RegExp(
      `^${p} evolved (.+?) to (.+?) (?:in the Active Spot|on the Bench)\\.$`,
    ),
    new RegExp(`^${own}(.+?) used `),
    new RegExp(`^${own}(.+) is now in the Active Spot\\.$`),
    new RegExp(`^${own}(.+) was Knocked Out!$`),
  ];
  const benchedBySearch = new RegExp(
    `^- ${p} drew \\d+ cards? and played (?:them|it) to the Bench\\.$`,
  );

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
