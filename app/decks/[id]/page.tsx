import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import { findDeck, findWinRate } from "@/lib/domain/decks";
import { listGames } from "@/lib/domain/games";
import { ButtonLink } from "../../components/ui/button";
import { GameCard } from "../../components/ui/game-card";
import { GlyphLink } from "../../components/ui/glyph-link";
import { Menu } from "../../components/ui/menu";
import { Panel } from "../../components/ui/panel";
import { formatWinRate, RecordBadge } from "../../components/ui/record-badge";
import { Reveal } from "../../components/ui/reveal";
import { Heading } from "../../components/ui/text";
import { TextBox } from "../../components/ui/text-box";

export default async function DeckPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { userId } = await auth.protect();
  const deckId = Number((await params).id);
  if (!Number.isInteger(deckId) || deckId <= 0) {
    notFound();
  }

  const deck = await findDeck({ userId, deckId });
  if (!deck) {
    notFound();
  }
  const games = await listGames({ userId, deckId });
  const winRate = findWinRate(deck);

  return (
    <main className="mx-auto flex w-full max-w-xl flex-col gap-6 px-4 py-6">
      <GlyphLink href="/decks" className="self-start">
        &lt; Decks
      </GlyphLink>
      <div className="flex flex-col gap-3">
        <Heading>{deck.title}</Heading>
        {/* The record and the action that changes it share a row. The win
            rate sits with the game count below, so the row fits a phone. */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <RecordBadge wins={deck.wins} losses={deck.losses} />
          <ButtonLink href={`/decks/${deck.id}/games/new`}>
            + Add game
          </ButtonLink>
        </div>
      </div>

      {games.length === 0 ? (
        <TextBox>No games on file yet. Add one to start the record.</TextBox>
      ) : (
        <Panel
          title={`Games · ${games.length}${winRate !== undefined ? ` · ${formatWinRate(winRate)}` : ""}`}
          flush
        >
          <Menu>
            {games.map((game, index) => (
              <Reveal key={game.id} index={index}>
                <GameCard game={game} />
              </Reveal>
            ))}
          </Menu>
        </Panel>
      )}

      <GlyphLink href={`/decks/${deck.id}/delete`} className="self-start">
        x Delete deck
      </GlyphLink>
    </main>
  );
}
