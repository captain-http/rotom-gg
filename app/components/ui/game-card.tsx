import type { Game } from "@/lib/domain/games";
import { Caption } from "./text";
import { Mark } from "./mark";

// A game as a notched sheet that opens to its log, printed with a ruled
// left margin.
export function GameCard({ game, open }: { game: Game; open?: boolean }) {
  return (
    <details open={open} className="notch bg-surface text-surface-foreground">
      <summary className="flex cursor-pointer flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3">
        <span>Game #{game.id}</span>
        <ResultMark result={game.result} />
        <GameFacts game={game} />
      </summary>
      <pre className="mx-4 mb-3 overflow-x-auto border-l-2 border-border pl-3 text-meta whitespace-pre-wrap">
        {game.log}
      </pre>
    </details>
  );
}

function ResultMark({ result }: { result: Game["result"] }) {
  if (result === "win") return <Mark tone="win">Win</Mark>;
  if (result === "loss") return <Mark tone="loss">Loss</Mark>;
  return <Mark tone="neutral">Unknown</Mark>;
}

function GameFacts({ game }: { game: Game }) {
  const facts = [
    game.turnCount !== null && `${game.turnCount} turns`,
    game.wentFirst !== null && (game.wentFirst ? "Went first" : "Went second"),
  ].filter(Boolean);
  if (facts.length === 0) return null;

  return <Caption as="span">{facts.join(" · ")}</Caption>;
}
