import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

// A list of choices, like a Pokémon menu: rows split by hairlines, each with
// a cursor that fills in under the pointer or focus. Sits in a flush Panel;
// its children are <li> rows.
export function Menu({ children }: { children: ReactNode }) {
  return <ul className="flex flex-col divide-y divide-rule">{children}</ul>;
}

// The row's layout, shared with GameCard's and MatchupCard's <summary>: the cursor's column is
// always there, so nothing moves when it appears.
export const MENU_ROW =
  "group grid grid-cols-[11px_1fr] items-center gap-x-2 px-3 py-3 outline-offset-[-4px]";

// What turns the cursor down: the <details> a row opens, by its group name.
// Named apart because a group of games holds games, and each must turn only
// its own cursor.
const OPENS = {
  game: {
    resting: "group-open/game:invisible",
    active: "group-open/game:visible group-open/game:rotate-90",
  },
  games: {
    resting: "group-open/games:invisible",
    active: "group-open/games:visible group-open/games:rotate-90",
  },
};

// The cursor. At rest it's a muted outline, ▷, so every row shows it can be
// chosen, hover or no hover; under the pointer or focus it fills in, ▶, in
// accent. A row that opens in place keeps it filled and turned down while
// open.
export function Cursor({ opens }: { opens?: keyof typeof OPENS }) {
  return (
    <span aria-hidden className="inline-grid font-mono text-meta">
      <span
        className={`col-start-1 row-start-1 text-muted group-hover:invisible group-focus-visible:invisible ${opens ? OPENS[opens].resting : ""}`}
      >
        ▷
      </span>
      <span
        className={`invisible col-start-1 row-start-1 text-accent group-hover:visible group-focus-visible:visible ${opens ? OPENS[opens].active : ""}`}
      >
        ▶
      </span>
    </span>
  );
}

// A row that opens a page. Wrap it in an <li>, or in Reveal, which is one.
export function MenuItem({ children, ...props }: ComponentProps<typeof Link>) {
  return (
    <Link className={MENU_ROW} {...props}>
      <Cursor />
      {children}
    </Link>
  );
}
