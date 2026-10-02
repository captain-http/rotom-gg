// A win rate as its figure and a framed meter filled green up to the rate:
// the meter is for scanning down a column, the figure for reading. The rest
// of the track stays empty; losses already wear red in the record. With no
// rate yet, the track is empty and the figure is dashes, so a column of
// meters has no holes.
export function WinRateMeter({
  // From findWinRate.
  winRate,
}: {
  winRate: number | undefined;
}) {
  return (
    <span className="flex items-center gap-2">
      {/* As wide as "100%", so a column of meters lines up. */}
      <span className="inline-grid text-right font-mono text-meta tracking-wider text-muted">
        <span className="col-start-1 row-start-1">
          {winRate === undefined ? (
            <>
              <span aria-hidden>--%</span>
              <span className="sr-only">No win rate yet</span>
            </>
          ) : (
            <>
              {winRate}%<span className="sr-only"> win rate</span>
            </>
          )}
        </span>
        <span aria-hidden className="invisible col-start-1 row-start-1">
          100%
        </span>
      </span>
      <span
        aria-hidden
        // Shorter on a phone, so a row keeps its figures on one line.
        className="block h-2 w-8 shrink-0 border-2 border-border bg-surface sm:w-12"
      >
        <span
          className="block h-full bg-win"
          style={{ width: `${winRate ?? 0}%` }}
        />
      </span>
    </span>
  );
}
