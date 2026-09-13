import { auth } from "@clerk/nextjs/server";
import { listDecks } from "@/lib/domain/decks";
import { Button } from "../components/ui/button";
import { DeckCard } from "../components/ui/deck-card";
import { Input } from "../components/ui/field";
import { Reveal } from "../components/ui/reveal";
import { Caption, Heading } from "../components/ui/text";
import { createDeckAction } from "./actions";

export default async function DecksPage() {
  const { userId } = await auth.protect();
  const decks = await listDecks(userId);

  return (
    <main className="mx-auto flex w-full max-w-xl flex-col gap-6 px-4 py-6">
      <Heading className="uppercase">Decks</Heading>

      <form action={createDeckAction} className="flex gap-2">
        <Input
          name="title"
          required
          maxLength={100}
          placeholder="Deck title"
          aria-label="Deck title"
          className="min-w-0 flex-1"
        />
        <Button type="submit">+ New</Button>
      </form>

      {decks.length === 0 ? (
        <Caption>No decks on file yet.</Caption>
      ) : (
        <ul className="flex flex-col gap-2">
          {decks.map((deck, index) => (
            <Reveal key={deck.id} index={index}>
              <DeckCard deck={deck} />
            </Reveal>
          ))}
        </ul>
      )}
    </main>
  );
}
