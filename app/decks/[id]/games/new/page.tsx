import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { findDeck } from "@/lib/domain/decks";
import { Button } from "../../../../components/ui/button";
import { Textarea } from "../../../../components/ui/field";
import { Caption, Heading } from "../../../../components/ui/text";
import { createGameAction } from "./actions";

export default async function NewGamePage({
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

  return (
    <main className="mx-auto flex w-full max-w-xl flex-col gap-6 px-4 py-6">
      <Link
        href={`/decks/${deck.id}`}
        className="self-start px-1 text-meta tracking-wider text-muted uppercase transition-colors duration-75 ease-flick hover:bg-mark hover:text-mark-foreground"
      >
        &lt; {deck.title}
      </Link>
      <Heading className="uppercase">New game</Heading>

      <form action={createGameAction} className="flex flex-col gap-2">
        <input type="hidden" name="deckId" value={deck.id} />
        <Caption as="label" htmlFor="log">
          File a battle log
        </Caption>
        <Textarea
          id="log"
          name="log"
          required
          rows={16}
          placeholder="Paste a game log from Pokémon TCG Live"
          className="text-meta"
        />
        <Button type="submit" className="self-start">
          + Add game
        </Button>
      </form>
    </main>
  );
}
