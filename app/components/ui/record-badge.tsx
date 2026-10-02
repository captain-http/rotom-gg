// A record as one badge of two joined halves — wins, then losses. Counts are
// padded to two digits so badges line up, and a zero half stays neutral so
// color only marks what happened. A page's own record; a row's is RecordBar.
export function RecordBadge({
  wins,
  losses,
}: {
  wins: number;
  losses: number;
}) {
  return (
    <span className="flex font-mono text-body tracking-wider whitespace-nowrap uppercase">
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
  );
}

// "71% win rate"; an 8% rate reads "08%", so rates hold one width.
export function formatWinRate(winRate: number): string {
  return `${pad(winRate)}% win rate`;
}

// "05": counts hold two digits, so records line up.
export function pad(count: number): string {
  return String(count).padStart(2, "0");
}
