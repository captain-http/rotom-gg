import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { CSSProperties } from "react";
import { findDeck } from "@/lib/domain/decks";
import { listGames, type Game } from "@/lib/domain/games";
import { Button } from "../../components/ui/button";
import { Textarea } from "../../components/ui/field";
import { Mark } from "../../components/ui/mark";
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
      <h1 className="self-start bg-highlight px-1 text-heading text-highlight-foreground">
        {deck.title}
      </h1>

      <form action={createGameAction} className="flex flex-col gap-2">
        <input type="hidden" name="deckId" value={deck.id} />
        <label
          htmlFor="log"
          className="text-meta tracking-wider text-muted uppercase"
        >
          File a battle log
        </label>
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

      <h2 className="text-meta tracking-wider text-muted uppercase">
        Games on file: {games.length}
      </h2>
      {games.length === 0 ? (
        <p className="text-meta tracking-wider text-muted uppercase">
          No games yet.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {games.map((game, index) => (
            <li
              key={game.id}
              className="notch animate-reveal bg-surface text-surface-foreground [animation-delay:calc(var(--i)*60ms)]"
              style={{ "--i": index } as CSSProperties}
            >
              <details>
                <summary className="flex cursor-pointer flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3">
                  <span>Game #{game.id}</span>
                  <ResultMark result={game.result} />
                  <GameFacts game={game} />
                </summary>
                {/* The log as a printout: a ruled margin down the left edge. */}
                <pre className="mx-4 mb-3 overflow-x-auto border-l-2 border-border pl-3 text-meta whitespace-pre-wrap">
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

function ResultMark({ result }: { result: Game["result"] }) {
  if (result === "win") return <Mark tone="win">Win</Mark>;
  if (result === "loss") return <Mark tone="loss">Loss</Mark>;
  return <Mark tone="neutral">Unknown</Mark>;
}

function GameFacts({ game }: { game: Game }) {
  const facts = [
    game.turnCount !== null && `${game.turnCount} turns`,
    game.wentFirst !== null && (game.wentFirst ? "Went first" : "Went second"),
  ].filter(Boolean);
  if (facts.length === 0) return null;

  return (
    <span className="text-meta tracking-wider text-muted uppercase">
      {facts.join(" · ")}
    </span>
  );
}
