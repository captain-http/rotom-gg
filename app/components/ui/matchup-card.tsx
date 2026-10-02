import type { Matchup } from "@/lib/domain/games";
import { GamesCard } from "./games-card";
import { SignaturePokemon } from "./signature-pokemon";

// A Matchup as a menu row, shown by the Opponent Archetype's Signature
// Pokémon, that opens to its games. Goes in a Menu, inside an <li>.
export function MatchupCard({
  matchup,
  open,
}: {
  matchup: Matchup;
  open?: boolean;
}) {
  return (
    <GamesCard
      label={
        <SignaturePokemon
          name={matchup.archetype}
          signaturePokemon={matchup.signaturePokemon}
        />
      }
      wins={matchup.wins}
      losses={matchup.losses}
      games={matchup.games}
      hideOpponent
      open={open}
    />
  );
}
