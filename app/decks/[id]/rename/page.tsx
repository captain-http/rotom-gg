import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import { findDeck } from "@/lib/domain/decks";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/field";
import { GlyphLink } from "../../../components/ui/glyph-link";
import { Caption, Heading } from "../../../components/ui/text";
import { DECK_TITLE_MAX_LENGTH, DECK_TITLE_PATTERN } from "../../deck-title";
import { renameDeckAction } from "./actions";

export default async function RenameDeckPage({
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
      <Heading>Rename deck</Heading>

      <form action={renameDeckAction} className="flex flex-col gap-3">
        <input type="hidden" name="deckId" value={deck.id} />
        <Caption as="label" htmlFor="title">
          Deck title
        </Caption>
        <Input
          id="title"
          name="title"
          required
          maxLength={DECK_TITLE_MAX_LENGTH}
          pattern={DECK_TITLE_PATTERN}
          defaultValue={deck.title}
        />
        <Button type="submit" className="self-start">
          ~ Rename
        </Button>
      </form>
    </main>
  );
}
