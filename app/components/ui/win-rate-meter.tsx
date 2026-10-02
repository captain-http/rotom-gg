// A win rate as a framed meter, filled green up to the rate, with the figure
// beside it: the meter is for scanning down a column, the figure for reading.
// The rest of the track stays empty; losses already wear red in the record.
export function WinRateMeter({
  // From findWinRate.
  winRate,
}: {
  winRate: number;
}) {
  return (
    <span className="flex items-center gap-2">
      <span
        aria-hidden
        className="block h-2 w-12 shrink-0 border-2 border-border bg-surface"
      >
        <span
          className="block h-full bg-win"
          style={{ width: `${winRate}%` }}
        />
      </span>
      {/* As wide as "100%", so a column of meters lines up. */}
      <span className="inline-grid text-right font-mono text-meta tracking-wider text-muted">
        <span className="col-start-1 row-start-1">
          {winRate}%<span className="sr-only"> win rate</span>
        </span>
        <span aria-hidden className="invisible col-start-1 row-start-1">
          100%
        </span>
      </span>
    </span>
  );
}
