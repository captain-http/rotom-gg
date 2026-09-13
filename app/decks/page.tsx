import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import type { CSSProperties } from "react";
import { listDecks } from "@/lib/domain/decks";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/field";
import { Mark } from "../components/ui/mark";
import { createDeckAction } from "./actions";

export default async function DecksPage() {
  const { userId } = await auth.protect();
  const decks = await listDecks(userId);

  return (
    <main className="mx-auto flex w-full max-w-xl flex-col gap-6 px-4 py-6">
      <h1 className="self-start bg-highlight px-1 text-heading text-highlight-foreground uppercase">
        Decks
      </h1>

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
        <p className="text-meta tracking-wider text-muted uppercase">
          No decks on file yet.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {decks.map((deck, index) => (
            <li
              key={deck.id}
              className="animate-reveal [animation-delay:calc(var(--i)*60ms)]"
              style={{ "--i": index } as CSSProperties}
            >
              <Link
                href={`/decks/${deck.id}`}
                className="notch flex items-center justify-between gap-4 bg-surface px-4 py-3 text-surface-foreground transition-colors duration-75 ease-flick hover:bg-mark hover:text-mark-foreground"
              >
                <span className="min-w-0 truncate">{deck.title}</span>
                <span className="flex shrink-0 gap-1">
                  <Mark tone={deck.wins > 0 ? "win" : "neutral"}>
                    {deck.wins}W
                  </Mark>
                  <Mark tone={deck.losses > 0 ? "loss" : "neutral"}>
                    {deck.losses}L
                  </Mark>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
