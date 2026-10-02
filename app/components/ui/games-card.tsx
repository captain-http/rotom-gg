import { findWinRate } from "@/lib/domain/decks";
import type { Game } from "@/lib/domain/games";
import type { ReactNode } from "react";
import { GameCard } from "./game-card";
import { MENU_ROW } from "./menu";
import { RecordBadge } from "./record-badge";
import { WinRateMeter } from "./win-rate-meter";

// A group of games — a Matchup, a Day — as a menu row that opens to them,
// each of which opens to its log. The games sit indented under a hairline,
// not in a frame of their own, lined up with the row's content as a game's
// log is. Goes in a Menu, inside an <li>.
export function GamesCard({
  label,
  wins,
  losses,
  games,
  open,
  hideOpponent,
}: {
  // What the games have in common, shown before their figures.
  label: ReactNode;
  wins: number;
  losses: number;
  games: Game[];
  open?: boolean;
  // When the label already shows the games' opponent.
  hideOpponent?: boolean;
}) {
  return (
    <details open={open} className="group/games">
      <summary
        className={`${MENU_ROW} cursor-pointer list-none [&::-webkit-details-marker]:hidden`}
      >
        {/* The menu cursor, turned down while the games are open. */}
        <span
          aria-hidden
          className="invisible inline-block font-mono text-meta text-accent group-hover:visible group-focus-visible:visible group-open/games:visible group-open/games:rotate-90"
        >
          ▶
        </span>
        {/* What on the left, how it went on the right: the record, the rate,
            and the meter each hold one width, so they make three columns
            down the menu. */}
        <span className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
          {label}
          <span className="ml-auto flex items-center gap-2 sm:gap-3">
            <RecordBadge wins={wins} losses={losses} compact />
            <WinRateMeter winRate={findWinRate({ wins, losses })} />
          </span>
        </span>
      </summary>
      <ul className="ml-7 flex flex-col divide-y divide-rule border-t border-rule">
        {games.map((game) => (
          <li key={game.id}>
            <GameCard game={game} hideOpponent={hideOpponent} />
          </li>
        ))}
      </ul>
    </details>
  );
}
