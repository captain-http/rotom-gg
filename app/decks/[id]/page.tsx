import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { findDeck } from "@/lib/domain/decks";
import { listGames } from "@/lib/domain/games";
import { Button } from "../../components/ui/button";
import { Textarea } from "../../components/ui/field";
import { GameCard } from "../../components/ui/game-card";
import { Reveal } from "../../components/ui/reveal";
import { Caption, Heading } from "../../components/ui/text";
import { createGameAction } from "./actions";

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
      <Heading>{deck.title}</Heading>

      <form action={createGameAction} className="flex flex-col gap-2">
        <input type="hidden" name="deckId" value={deck.id} />
        <Caption as="label" htmlFor="log">
          File a battle log
        </Caption>
        <Textarea
          id="log"
          name="log"
          required
          rows={6}
          placeholder="Paste a game log from Pokémon TCG Live"
          className="text-meta"
        />
        <Button type="submit" className="self-start">
          + Add game
        </Button>
      </form>

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
