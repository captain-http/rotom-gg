import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import { findDeck } from "@/lib/domain/decks";
import { GlyphLink } from "../../../../components/ui/glyph-link";
import { Heading } from "../../../../components/ui/text";
import { NewGameForm } from "./new-game-form";

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
      <GlyphLink href={`/decks/${deck.id}`} className="self-start">
        &lt; {deck.title}
      </GlyphLink>
      <Heading>New game</Heading>

      <NewGameForm deckId={deck.id} />
    </main>
  );
}
