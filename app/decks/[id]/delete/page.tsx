import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { findDeck } from "@/lib/domain/decks";
import { countGames } from "@/lib/domain/games";
import { Button } from "../../../components/ui/button";
import { Heading } from "../../../components/ui/text";
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
      <Link
        href={`/decks/${deck.id}`}
        className="self-start px-1 text-meta tracking-wider text-muted uppercase transition-colors duration-75 ease-flick hover:bg-mark hover:text-mark-foreground"
      >
        &lt; {deck.title}
      </Link>
      <Heading className="uppercase">Delete deck</Heading>

      <p className="border-l-[7px] border-muted pl-3 text-meta text-muted uppercase">
        {deck.title} and its {gameCount} {gameCount === 1 ? "game" : "games"}{" "}
        will be deleted. This can&apos;t be undone.
      </p>

      <form action={deleteDeckAction}>
        <input type="hidden" name="deckId" value={deck.id} />
        <Button type="submit">x Delete deck</Button>
      </form>
    </main>
  );
}
