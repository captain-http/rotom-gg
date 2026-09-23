import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import { findDeck } from "@/lib/domain/decks";
import { countGames } from "@/lib/domain/games";
import { Button } from "../../../components/ui/button";
import { GlyphLink } from "../../../components/ui/glyph-link";
import { Heading } from "../../../components/ui/text";
import { TextBox } from "../../../components/ui/text-box";
import { deleteDeckAction } from "./actions";

export default async function DeleteDeckPage({
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
  const gameCount = await countGames({ userId, deckId });

  return (
    <main className="mx-auto flex w-full max-w-xl flex-col gap-6 px-4 py-6">
      <GlyphLink href={`/decks/${deck.id}`} className="self-start">
        &lt; {deck.title}
      </GlyphLink>
      <Heading>Delete deck</Heading>

      <TextBox role="alert">
        {deck.title} and its {gameCount} {gameCount === 1 ? "game" : "games"}{" "}
        will be deleted. This can&apos;t be undone.
      </TextBox>

      <form action={deleteDeckAction}>
        <input type="hidden" name="deckId" value={deck.id} />
        <Button type="submit">x Delete deck</Button>
      </form>
    </main>
  );
}
