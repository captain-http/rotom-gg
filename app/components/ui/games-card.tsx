import type { Game } from "@/lib/domain/games";
import type { ReactNode } from "react";
import { GameCard } from "./game-card";
import { MENU_ROW } from "./menu";
import { RecordBar } from "./record-bar";
import { Caption } from "./text";

// A group of games — a Matchup, a Day — as a menu row that opens to them,
// each of which opens to its log. The row is two lines: what the games have
// in common and how many they are, then how they went. The games sit indented under a hairline,
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
  // What the games have in common, shown above their record.
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
        className={`${MENU_ROW} cursor-pointer list-none gap-y-2 [&::-webkit-details-marker]:hidden`}
      >
        {/* The menu cursor, beside the label and turned down while the games
            are open. */}
        <span
          aria-hidden
          className="invisible inline-block font-mono text-meta text-accent group-hover:visible group-focus-visible:visible group-open/games:visible group-open/games:rotate-90"
        >
          ▶
        </span>
        {/* The count ends the title line as the rate ends the bar's, so the
            two figures make a column. It counts every game, so it can run
            ahead of the record when a result is unknown. */}
        <span className="flex min-w-0 items-center justify-between gap-3">
          <span className="min-w-0">{label}</span>
          <Caption as="span" className="shrink-0 whitespace-nowrap">
            {games.length} {games.length === 1 ? "game" : "games"}
          </Caption>
        </span>
        <span className="col-start-2">
          <RecordBar wins={wins} losses={losses} />
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
