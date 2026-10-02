import { findWinRate } from "@/lib/domain/decks";
import { Mark } from "./mark";
import { pad } from "./record-badge";

// A row's record as a tug of war: the win count, a bar split green and red
// in proportion to wins and losses, the loss count, and the win rate spelled
// out. The counts are Marks in the bar's own colors, so they name what each
// color is and the bar needs no legend. A zero count stays neutral, and with
// no result yet the bar is empty.
export function RecordBar({ wins, losses }: { wins: number; losses: number }) {
  const winRate = findWinRate({ wins, losses });
  return (
    <span className="flex items-center gap-3 font-mono text-meta tracking-wider whitespace-nowrap uppercase">
      <span className="flex min-w-0 flex-1 items-center gap-2">
        <Mark tone={wins > 0 ? "win" : "neutral"}>W {pad(wins)}</Mark>
        <span aria-hidden className="flex h-2 min-w-0 flex-1 bg-rule">
          {winRate !== undefined && (
            <>
              <span className="bg-win" style={{ width: `${winRate}%` }} />
              <span className="flex-1 bg-loss" />
            </>
          )}
        </span>
        <Mark tone={losses > 0 ? "loss" : "neutral"}>L {pad(losses)}</Mark>
      </span>
      {/* As wide as the widest rate, so a column of bars holds one length. */}
      <span className="inline-grid text-right text-muted">
        <span className="col-start-1 row-start-1">
          {winRate === undefined ? "No result" : `${winRate}% win rate`}
        </span>
        <span aria-hidden className="invisible col-start-1 row-start-1">
          100% win rate
        </span>
      </span>
    </span>
  );
}
