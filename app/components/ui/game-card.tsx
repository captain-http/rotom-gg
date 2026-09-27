import type { Game } from "@/lib/domain/games";
import { Mark } from "./mark";
import { MENU_ROW } from "./menu";
import { SignaturePokemon } from "./signature-pokemon";
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
          <span className="flex items-center gap-1">
            <Caption as="span">vs</Caption>
            <SignaturePokemon
              name={game.opponentArchetype}
              signaturePokemon={game.opponentArchetypeIcons}
            />
          </span>
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
  if (result === "win")
    return (
      <Mark tone="win">
        <AsWideAsLoss>Win</AsWideAsLoss>
      </Mark>
    );
  if (result === "loss") return <Mark tone="loss">Loss</Mark>;
  return <Mark tone="neutral">Unknown</Mark>;
}

// Centers the label in a box as wide as "Loss", so a column of results lines
// up whichever way each game went.
function AsWideAsLoss({ children }: { children: string }) {
  return (
    <span className="inline-grid text-center">
      <span className="col-start-1 row-start-1">{children}</span>
      <span aria-hidden className="invisible col-start-1 row-start-1">
        Loss
      </span>
    </span>
  );
}

function GameFacts({ game }: { game: Game }) {
  const facts = [
    game.turnCount !== null && `${game.turnCount} turns`,
    game.wentFirst !== null && (game.wentFirst ? "Went first" : "Went second"),
  ].filter((fact) => fact !== false);
  if (facts.length === 0) return null;

  // A line breaks between facts, never inside one.
  return (
    <Caption as="span">
      {facts.map((fact, index) => (
        <span key={fact}>
          {index > 0 && " · "}
          <span className="whitespace-nowrap">{fact}</span>
        </span>
      ))}
    </Caption>
  );
}
