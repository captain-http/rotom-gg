import type { Game } from "@/lib/domain/games";
import type { ReactNode } from "react";
import { GameCard } from "./game-card";
import { Cursor, MENU_ROW } from "./menu";
import { RecordBar } from "./record-bar";
import { formatShare, ShareBar } from "./share-bar";
import { Caption } from "./text";

// A group of games — a Matchup, a Day — as a menu row that opens to them,
// each of which opens to its log. The row is what the games have in common,
// then how they went and how many they are. The games sit indented under a hairline,
// not in a frame of their own, lined up with the row's content as a game's
// log is. Goes in a Menu, inside an <li>.
export function GamesCard({
  label,
  wins,
  losses,
  games,
  totalGames,
  open,
  hideOpponent,
}: {
  // What the games have in common, shown above their record.
  label: ReactNode;
  wins: number;
  losses: number;
  games: Game[];
  // All the games these were picked from, when their share of them says
  // something: how common a Matchup is, but not how busy a Day was.
  totalGames?: number;
  open?: boolean;
  // When the label already shows the games' opponent.
  hideOpponent?: boolean;
}) {
  return (
    <details open={open} className="group/games">
      <summary
        className={`${MENU_ROW} cursor-pointer list-none gap-y-2 [&::-webkit-details-marker]:hidden`}
      >
        <Cursor opens="games" />
        {/* Without a share, the count ends the title line as the rate ends
            the bar's, so the two figures make a column. Either way it
            counts every game, so it can run ahead of the record when a
            result is unknown. */}
        <span className="flex min-w-0 items-center justify-between gap-3">
          <span className="min-w-0 flex-1">{label}</span>
          {totalGames === undefined && (
            <Caption as="span" className="shrink-0 whitespace-nowrap">
              {games.length} {games.length === 1 ? "game" : "games"}
            </Caption>
          )}
        </span>
        {/* The bars run under the cursor's column too, so they sit the same
            distance from both edges of the panel. */}
        <span className="col-span-2 flex flex-col gap-1">
          <RecordBar
            wins={wins}
            losses={losses}
            alsoFits={
              totalGames === undefined
                ? undefined
                : formatShare(totalGames, totalGames)
            }
          />
          {totalGames !== undefined && (
            <ShareBar count={games.length} total={totalGames} />
          )}
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
