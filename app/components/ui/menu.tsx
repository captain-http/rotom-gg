import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

// A list of choices, like a Pokémon menu: rows split by hairlines, and a ▶
// cursor beside the one under the pointer or focus. Sits in a flush Panel;
// its children are <li> rows.
export function Menu({ children }: { children: ReactNode }) {
  return <ul className="flex flex-col divide-y divide-rule">{children}</ul>;
}

// The row's layout, shared with GameCard's <summary>: the cursor's column is
// always there, so nothing moves when it appears.
export const MENU_ROW =
  "group grid grid-cols-[11px_1fr] items-center gap-x-2 px-3 py-3 outline-offset-[-4px]";

// The ▶ cursor. Invisible until its row is hovered or focused.
export function Cursor({ glyph = "▶" }: { glyph?: string }) {
  return (
    <span
      aria-hidden
      className="invisible font-mono text-meta text-accent group-hover:visible group-focus-visible:visible"
    >
      {glyph}
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
