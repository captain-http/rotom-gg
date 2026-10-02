import type { Game } from "@/lib/domain/games";
import { listGameFacts } from "./game-card";
import { MENU_ROW } from "./menu";
import { Panel } from "./panel";
import { SignaturePokemon } from "./signature-pokemon";

const TONES = {
  win: { label: "Win", fill: "bg-win text-win-foreground" },
  loss: { label: "Loss", fill: "bg-loss text-loss-foreground" },
};

// A deck's Latest game as a panel of its own, filled green or red by its
// result: the one game worth seeing from across the room. The panel's title
// says the result too, so it reads without the color. The opponent's
// archetype leads, its Signature Pokémon end the line, and the game opens
// to its log, which stays on the surface. A game with no result isn't filled.
export function LatestGameCard({ game, open }: { game: Game; open?: boolean }) {
  const tone = game.result === null ? undefined : TONES[game.result];
  const facts = listGameFacts(game);
  const name = game.opponentArchetype ?? "Unknown archetype";
  const lastWord = name.slice(name.lastIndexOf(" ") + 1);
  const firstWords = name.slice(0, name.length - lastWord.length);
  // On a fill, muted text wouldn't read: the smaller face sets it apart.
  const quiet = `font-mono text-meta tracking-wider ${tone ? "" : "text-muted"}`;
  return (
    <Panel title={tone ? `Latest game · ${tone.label}` : "Latest game"} flush>
      <details open={open} className="group/game">
        {/* Pulled up under the panel's title, so the fill runs to the frame
            on every side. */}
        <summary
          className={`${MENU_ROW} -mt-2 cursor-pointer list-none pt-5 [&::-webkit-details-marker]:hidden ${tone?.fill ?? ""}`}
        >
          {/* The menu cursor, turned down while the log is open. On a fill
              it takes the text's color: yellow wouldn't show. */}
          <span
            aria-hidden
            className={`invisible inline-block font-mono text-meta group-hover:visible group-focus-visible:visible group-open/game:visible group-open/game:rotate-90 ${tone ? "" : "text-accent"}`}
          >
            ▶
          </span>
          <span className="flex min-w-0 flex-col gap-1">
            <span className="flex min-w-0 items-center justify-between gap-2">
              {/* A long name wraps between its words; the game's number
                  stays on its last word's line. */}
              <span className="min-w-0">
                {firstWords}
                <span className="whitespace-nowrap">
                  {lastWord} <span className={quiet}>· #{game.id}</span>
                </span>
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
            {facts.length > 0 && (
              <span className={`${quiet} uppercase`}>
                {/* A line breaks between facts, never inside one. */}
                {facts.map((fact, index) => (
                  <span key={fact}>
                    {index > 0 && " · "}
                    <span className="whitespace-nowrap">{fact}</span>
                  </span>
                ))}
              </span>
            )}
          </span>
        </summary>
        <pre className="m-3 ml-7 overflow-x-auto border-l-2 border-rule pl-3 font-mono text-meta whitespace-pre-wrap">
          {game.log}
        </pre>
      </details>
    </Panel>
  );
}
