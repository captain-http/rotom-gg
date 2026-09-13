// A deck's record as one badge of two joined halves — wins, then losses — with
// the win rate beside it in muted text: the record is the fact, the rate a
// reading of it. Counts are padded to two digits so badges line up, and a
// zero half stays neutral so amber only marks real wins. No rate without a
// decided game.
export function RecordBadge({
  wins,
  losses,
  winRate,
}: {
  wins: number;
  losses: number;
  // From findWinRate: undefined when nothing is decided yet.
  winRate: number | undefined;
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
        <span className="text-meta text-muted">{pad(winRate)}% win rate</span>
      )}
    </span>
  );
}

function pad(count: number): string {
  return String(count).padStart(2, "0");
}
