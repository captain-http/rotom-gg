import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { listDecks } from "@/lib/domain/decks";
import { createDeckAction } from "./actions";

export default async function DecksPage() {
  const { userId } = await auth.protect();
  const decks = await listDecks(userId);

  return (
    <main className="mx-auto flex w-full max-w-xl flex-col gap-4 p-4">
      <h1 className="text-2xl font-semibold">Decks</h1>

      <form action={createDeckAction} className="flex gap-2">
        <input
          name="title"
          required
          maxLength={100}
          placeholder="Deck title"
          aria-label="Deck title"
          className="min-w-0 flex-1 rounded border border-foreground/20 bg-background px-3 py-2"
        />
        <button
          type="submit"
          className="rounded bg-foreground px-3 py-2 text-background"
        >
          Create deck
        </button>
      </form>

      {decks.length === 0 ? (
        <p>No decks yet.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {decks.map((deck) => (
            <li key={deck.id}>
              <Link
                href={`/decks/${deck.id}`}
                className="flex justify-between gap-4 rounded border border-foreground/20 px-3 py-2"
              >
                <span>{deck.title}</span>
                <span className="shrink-0">
                  {deck.wins}W {deck.losses}L
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
