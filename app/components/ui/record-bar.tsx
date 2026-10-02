import { findWinRate } from "@/lib/domain/decks";
import type { ReactNode } from "react";
import { Mark } from "./mark";
import { pad } from "./record-badge";

// The widest a RecordBar's figure gets.
export const WIDEST_WIN_RATE = "100% win rate";

// A row's record as a tug of war: the win count, a bar split green and red
// in proportion to wins and losses, the loss count, and the win rate spelled
// out. The counts are Marks in the bar's own colors, so they name what each
// color is and the bar needs no legend; the bar is as tall as they are. A
// zero count stays neutral, and with no result yet the bar is empty.
export function RecordBar({
  wins,
  losses,
  alsoFits,
}: {
  wins: number;
  losses: number;
  // The widest figure of a bar stacked with this one, so both end together.
  alsoFits?: string;
}) {
  const winRate = findWinRate({ wins, losses });
  return (
    <span className="flex items-center gap-3 font-mono text-meta tracking-wider whitespace-nowrap uppercase">
      <span className="flex min-w-0 flex-1 items-stretch gap-2">
        <Mark tone={wins > 0 ? "win" : "neutral"}>W {pad(wins)}</Mark>
        <span aria-hidden className="flex min-w-0 flex-1 bg-rule">
          {winRate !== undefined && (
            <>
              <span className="bg-win" style={{ width: `${winRate}%` }} />
              <span className="flex-1 bg-loss" />
            </>
          )}
        </span>
        <Mark tone={losses > 0 ? "loss" : "neutral"}>L {pad(losses)}</Mark>
      </span>
      <BarFigure fits={[WIDEST_WIN_RATE, alsoFits]}>
        {winRate === undefined ? "No result" : `${winRate}% win rate`}
      </BarFigure>
    </span>
  );
}

// What a bar measures, said in words at its end. As wide as the widest it
// could say, so a column of bars holds one length.
export function BarFigure({
  children,
  fits,
}: {
  children: ReactNode;
  fits: (string | undefined)[];
}) {
  return (
    <span className="inline-grid text-right text-muted">
      <span className="col-start-1 row-start-1">{children}</span>
      {fits.map(
        (widest) =>
          widest !== undefined && (
            <span
              key={widest}
              aria-hidden
              className="invisible col-start-1 row-start-1"
            >
              {widest}
            </span>
          ),
      )}
    </span>
  );
}
