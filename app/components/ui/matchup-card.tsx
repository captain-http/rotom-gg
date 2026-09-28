import { findWinRate } from "@/lib/domain/decks";
import type { Matchup } from "@/lib/domain/games";
import { GameCard } from "./game-card";
import { MENU_ROW } from "./menu";
import { RecordBadge } from "./record-badge";
import { SignaturePokemon } from "./signature-pokemon";

// A Matchup as a menu row that opens to its games, each of which opens to its
// log. The games sit indented under a hairline, not in a frame of their own,
// lined up with the row's content as a game's log is.
// Goes in a Menu, inside an <li>.
export function MatchupCard({
  matchup,
  open,
}: {
  matchup: Matchup;
  open?: boolean;
}) {
  return (
    <details open={open} className="group/matchup">
      <summary
        className={`${MENU_ROW} cursor-pointer list-none [&::-webkit-details-marker]:hidden`}
      >
        {/* The menu cursor, turned down while the games are open. */}
        <span
          aria-hidden
          className="invisible inline-block font-mono text-meta text-accent group-hover:visible group-focus-visible:visible group-open/matchup:visible group-open/matchup:rotate-90"
        >
          ▶
        </span>
        {/* The rate may wrap under the record; the record stays beside the
            Pokémon it's against. */}
        <span className="flex items-center gap-3">
          <SignaturePokemon
            name={matchup.archetype}
            signaturePokemon={matchup.signaturePokemon}
          />
          <RecordBadge
            wins={matchup.wins}
            losses={matchup.losses}
            winRate={findWinRate(matchup)}
          />
        </span>
      </summary>
      <ul className="ml-7 flex flex-col divide-y divide-rule border-t border-rule">
        {matchup.games.map((game) => (
          <li key={game.id}>
            <GameCard game={game} />
          </li>
        ))}
      </ul>
    </details>
  );
}
