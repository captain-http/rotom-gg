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
}: {
  // What the games have in common, shown before their record.
  label: ReactNode;
  wins: number;
  losses: number;
  games: Game[];
  open?: boolean;
}) {
  const winRate = findWinRate({ wins, losses });
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
        {/* The record stays beside the label it's for. The meter sits at the
            row's far edge, so meters make a column; on a phone it wraps under
            the record. */}
        <span className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <span className="flex items-center gap-3">
            {label}
            <RecordBadge wins={wins} losses={losses} />
          </span>
          {winRate !== undefined && <WinRateMeter winRate={winRate} />}
        </span>
      </summary>
      <ul className="ml-7 flex flex-col divide-y divide-rule border-t border-rule">
        {games.map((game) => (
          <li key={game.id}>
            <GameCard game={game} />
          </li>
        ))}
      </ul>
    </details>
  );
}
