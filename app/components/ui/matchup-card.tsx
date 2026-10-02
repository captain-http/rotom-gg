import type { Matchup } from "@/lib/domain/games";
import { GamesCard } from "./games-card";
import { SignaturePokemon } from "./signature-pokemon";

// A Matchup as a menu row, shown by the Opponent Archetype's Signature
// Pokémon and its name, that opens to its games. Under its record, its share
// of the deck's games says how common the archetype is. Goes in a Menu,
// inside an <li>.
export function MatchupCard({
  matchup,
  totalGames,
  open,
}: {
  matchup: Matchup;
  // The deck's games, across every Matchup.
  totalGames: number;
  open?: boolean;
}) {
  return (
    <GamesCard
      label={
        <span className="flex min-w-0 items-center gap-2">
          {/* The name beside them is read instead. */}
          <span aria-hidden className="flex">
            <SignaturePokemon
              name={matchup.archetype}
              signaturePokemon={matchup.signaturePokemon}
            />
          </span>
          <span
            // A long name wraps on a phone: there is no hover to read it by.
            className={`min-w-0 ${matchup.archetype === null ? "text-muted" : ""}`}
          >
            {matchup.archetype ?? "Unknown archetype"}
          </span>
        </span>
      }
      wins={matchup.wins}
      losses={matchup.losses}
      games={matchup.games}
      totalGames={totalGames}
      hideOpponent
      open={open}
    />
  );
}
