import type { Game } from "@/lib/domain/games";
import { Mark } from "./mark";
import { MENU_ROW } from "./menu";
import { Caption } from "./text";

// A game as a menu row that opens to its log, printed in mono with a ruled
// left margin. Goes in a Menu, inside an <li>.
export function GameCard({ game, open }: { game: Game; open?: boolean }) {
  return (
    <details open={open} className="group/game">
      <summary
        className={`${MENU_ROW} cursor-pointer list-none [&::-webkit-details-marker]:hidden`}
      >
        {/* The menu cursor, turned down while the log is open. */}
        <span
          aria-hidden
          className="invisible inline-block font-mono text-meta text-accent group-hover:visible group-focus-visible:visible group-open/game:visible group-open/game:rotate-90"
        >
          ▶
        </span>
        <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span>Game #{game.id}</span>
          <ResultMark result={game.result} />
          <GameFacts game={game} />
        </span>
      </summary>
      <pre className="mr-3 mb-3 ml-7 overflow-x-auto border-l-2 border-rule pl-3 font-mono text-meta whitespace-pre-wrap">
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
