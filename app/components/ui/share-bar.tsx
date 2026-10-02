import { BarFigure, WIDEST_WIN_RATE } from "./record-bar";

// How much of a deck's games a row holds: a bar filled up to its share, and
// the share spelled out as "2 of 6 games". Sits under a RecordBar and ends
// where it does. Thinner and without color, since it says how often, not how
// well.
export function ShareBar({ count, total }: { count: number; total: number }) {
  return (
    <span className="flex items-center gap-3 font-mono text-meta tracking-wider whitespace-nowrap uppercase">
      <span aria-hidden className="flex h-1 min-w-0 flex-1 bg-rule">
        {/* Never too thin to see: one game of hundreds is still a game. */}
        <span
          className="min-w-0.5 bg-muted"
          style={{ width: `${(count / total) * 100}%` }}
        />
      </span>
      <BarFigure fits={[WIDEST_WIN_RATE, formatShare(total, total)]}>
        {formatShare(count, total)}
      </BarFigure>
    </span>
  );
}

// "2 of 6 games"; "1 of 1 game".
export function formatShare(count: number, total: number): string {
  return `${count} of ${total} ${total === 1 ? "game" : "games"}`;
}
