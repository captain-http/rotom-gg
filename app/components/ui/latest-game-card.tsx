import type { Game } from "@/lib/domain/games";
import { listGameFacts } from "./game-card";
import { Mark } from "./mark";
import { MENU_ROW } from "./menu";
import { Panel } from "./panel";
import { SignaturePokemon } from "./signature-pokemon";
import { Caption } from "./text";

// A deck's Latest game as a panel of its own. The opponent's archetype
// leads, with the game's number beside it and its Signature Pokémon at the
// line's far end; the result and what's known of the game sit below. Opens
// to its log, as a GameCard does.
export function LatestGameCard({ game, open }: { game: Game; open?: boolean }) {
  return (
    <Panel title="Latest game" flush>
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
          <span className="flex min-w-0 flex-col gap-1">
            <span className="flex min-w-0 items-center justify-between gap-2">
              {/* On a phone the game's number takes its own line, under a
                  name free to wrap; with room, it follows the name. */}
              <span
                className={`min-w-0 ${game.opponentArchetype === null ? "text-muted" : ""}`}
              >
                {game.opponentArchetype ?? "Unknown archetype"}{" "}
                <Caption
                  as="span"
                  className="block whitespace-nowrap sm:inline"
                >
                  <span className="hidden sm:inline">· </span>Game #{game.id}
                </Caption>
              </span>
              {/* The name beside them is read instead. */}
              <span aria-hidden className="flex">
                <SignaturePokemon
                  name={game.opponentArchetype}
                  signaturePokemon={game.opponentArchetypeIcons}
                  end
                />
              </span>
            </span>
            <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <ResultMark result={game.result} />
              {/* A line breaks between facts, never inside one. */}
              {listGameFacts(game).map((fact) => (
                <Caption key={fact} as="span" className="whitespace-nowrap">
                  · {fact}
                </Caption>
              ))}
            </span>
          </span>
        </summary>
        <pre className="mr-3 mb-3 ml-7 overflow-x-auto border-l-2 border-rule pl-3 font-mono text-meta whitespace-pre-wrap">
          {game.log}
        </pre>
      </details>
    </Panel>
  );
}

function ResultMark({ result }: { result: Game["result"] }) {
  if (result === "win") return <Mark tone="win">Win</Mark>;
  if (result === "loss") return <Mark tone="loss">Loss</Mark>;
  return <Mark tone="neutral">Unknown</Mark>;
}
