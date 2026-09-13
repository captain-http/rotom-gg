import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { findDeck } from "@/lib/domain/decks";
import { listGames } from "@/lib/domain/games";
import { createGameAction } from "./actions";

const RESULT_LABELS = { win: "Win", loss: "Loss", unknown: "Unknown" };

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
    <main className="mx-auto flex w-full max-w-xl flex-col gap-4 p-4">
      <Link href="/decks" className="underline">
        ← Decks
      </Link>
      <h1 className="text-2xl font-semibold">{deck.title}</h1>

      <form action={createGameAction} className="flex flex-col gap-2">
        <input type="hidden" name="deckId" value={deck.id} />
        <textarea
          name="log"
          required
          rows={6}
          placeholder="Paste a game log from Pokémon TCG Live"
          aria-label="Game log"
          className="rounded border border-foreground/20 bg-background px-3 py-2 font-mono text-sm"
        />
        <button
          type="submit"
          className="self-start rounded bg-foreground px-3 py-2 text-background"
        >
          Add game
        </button>
      </form>

      <h2 className="text-lg font-semibold">Games ({games.length})</h2>
      {games.length === 0 ? (
        <p>No games yet.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {games.map((game) => (
            <li
              key={game.id}
              className="rounded border border-foreground/20 px-3 py-2"
            >
              <details>
                <summary>
                  Game #{game.id} · {RESULT_LABELS[game.result ?? "unknown"]}
                </summary>
                <pre className="mt-2 overflow-x-auto text-sm whitespace-pre-wrap">
                  {game.log}
                </pre>
              </details>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
