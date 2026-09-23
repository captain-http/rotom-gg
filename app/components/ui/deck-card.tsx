import type { DeckWithRecord } from "@/lib/domain/decks";
import { Mark } from "./mark";
import { MenuItem } from "./menu";

// A deck as a menu row: title, then its win–loss record. Zero counts stay
// neutral so color only marks what happened. Goes in a Menu, inside an <li>.
export function DeckCard({ deck }: { deck: DeckWithRecord }) {
  return (
    <MenuItem href={`/decks/${deck.id}`}>
      <span className="flex min-w-0 items-center justify-between gap-4">
        <span className="min-w-0 truncate">{deck.title}</span>
        <span className="flex shrink-0 gap-1">
          <Mark tone={deck.wins > 0 ? "win" : "neutral"}>{deck.wins}W</Mark>
          <Mark tone={deck.losses > 0 ? "loss" : "neutral"}>
            {deck.losses}L
          </Mark>
        </span>
      </span>
    </MenuItem>
  );
}
