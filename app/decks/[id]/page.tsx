import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { findDeck, findWinRate } from "@/lib/domain/decks";
import { listGames } from "@/lib/domain/games";
import { ButtonLink } from "../../components/ui/button";
import { GameCard } from "../../components/ui/game-card";
import { RecordBadge } from "../../components/ui/record-badge";
import { Reveal } from "../../components/ui/reveal";
import { Caption, Heading } from "../../components/ui/text";

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

  return (
    <main className="mx-auto flex w-full max-w-xl flex-col gap-6 px-4 py-6">
      <Link
        href="/decks"
        className="self-start px-1 text-meta tracking-wider text-muted uppercase transition-colors duration-75 ease-flick hover:bg-mark hover:text-mark-foreground"
      >
        &lt; Decks
      </Link>
      <div className="flex flex-col gap-3">
        <Heading>{deck.title}</Heading>
        <RecordBadge
          wins={deck.wins}
          losses={deck.losses}
          winRate={findWinRate(deck)}
        />
      </div>

      <ButtonLink href={`/decks/${deck.id}/games/new`} className="self-start">
        + Add game
      </ButtonLink>

      <Caption as="h2">Games on file: {games.length}</Caption>
      {games.length === 0 ? (
        <Caption>No games yet.</Caption>
      ) : (
        <ul className="flex flex-col gap-2">
          {games.map((game, index) => (
            <Reveal key={game.id} index={index}>
              <GameCard game={game} />
            </Reveal>
          ))}
        </ul>
      )}
    </main>
  );
}
