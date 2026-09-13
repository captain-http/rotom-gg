export type ParsedLog = {
  // From the point of view of the player who exported the log.
  result: "win" | "loss" | null;
};

export function parseLog(log: string): ParsedLog {
  const lines = log.split(/\r?\n/);
  const players = playerNames(lines);
  const me = viewer(lines, players);
  const winner = findWinner(lines, players);

  if (!me || !winner) {
    return { result: null };
  }
  return { result: winner === me ? "win" : "loss" };
}

// "http_party drew 7 cards for the opening hand."
function playerNames(lines: string[]): string[] {
  return lines.flatMap((line) => {
    const match = line.match(/^(.+) drew 7 cards for the opening hand\.$/);
    return match?.[1] ? [match[1]] : [];
  });
}

// The log only names the cards the exporting player draws: "http_party drew
// Lillie's Determination." against "Opponent drew a card." So the viewer is
// the one player with a named draw.
function viewer(lines: string[], players: string[]): string | undefined {
  const withNamedDraws = players.filter((player) =>
    lines.some((line) => {
      if (!line.startsWith(`${player} drew `)) {
        return false;
      }
      const drawn = line.slice(`${player} drew `.length);
      return drawn !== "a card." && !/^\d+ (more )?cards?\b/.test(drawn);
    }),
  );
  return withNamedDraws.length === 1 ? withNamedDraws[0] : undefined;
}

// "No Benched Pokémon for backup. http_party wins."
function findWinner(lines: string[], players: string[]): string | undefined {
  return players.find((player) =>
    lines.some(
      (line) =>
        line === `${player} wins.` || line.endsWith(`. ${player} wins.`),
    ),
  );
}
