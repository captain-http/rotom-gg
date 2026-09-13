import Link from "next/link";
import type { DeckWithRecord } from "@/lib/domain/decks";
import { Mark } from "./mark";

// A deck as a notched sheet: title, then its win–loss record. Zero counts
// stay neutral so amber only marks real wins.
export function DeckCard({ deck }: { deck: DeckWithRecord }) {
  return (
    <Link
      href={`/decks/${deck.id}`}
      className="notch flex items-center justify-between gap-4 bg-surface px-4 py-3 text-surface-foreground transition-colors duration-75 ease-flick hover:bg-mark hover:text-mark-foreground"
    >
      <span className="min-w-0 truncate">{deck.title}</span>
      <span className="flex shrink-0 gap-1">
        <Mark tone={deck.wins > 0 ? "win" : "neutral"}>{deck.wins}W</Mark>
        <Mark tone={deck.losses > 0 ? "loss" : "neutral"}>{deck.losses}L</Mark>
      </span>
    </Link>
  );
}
