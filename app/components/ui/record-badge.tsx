// A deck's record as one badge of two joined halves — wins, then losses — with
// the win rate beside it in muted text: the record is the fact, the rate a
// reading of it. Counts are padded to two digits so badges line up, and a
// zero half stays neutral so amber only marks real wins. Leave out winRate
// where the rate is shown elsewhere, or where nothing is decided yet.
export function RecordBadge({
  wins,
  losses,
  winRate,
}: {
  wins: number;
  losses: number;
  // From findWinRate.
  winRate?: number;
}) {
  return (
    <span className="flex flex-wrap items-center gap-x-3 gap-y-1 tracking-wider uppercase">
      <span className="flex text-body">
        <span
          className={`border-2 px-2 ${wins > 0 ? "border-win bg-win text-win-foreground" : "border-border text-muted"}`}
        >
          W {pad(wins)}
        </span>
        <span
          className={`border-2 border-l-0 px-2 ${losses > 0 ? "border-loss bg-loss text-loss-foreground" : "border-border text-muted"}`}
        >
          L {pad(losses)}
        </span>
      </span>
      {winRate !== undefined && (
        <span className="text-meta text-muted">{formatWinRate(winRate)}</span>
      )}
    </span>
  );
}

// "71% win rate"; an 8% rate reads "08%", so rates hold one width.
export function formatWinRate(winRate: number): string {
  return `${pad(winRate)}% win rate`;
}

function pad(count: number): string {
  return String(count).padStart(2, "0");
}
