import Link from "next/link";
import type { ComponentProps } from "react";

// A link that says where it goes with a glyph instead of an underline:
// "> Decks" forward, "< Decks" back, "+ New" to create, "x Delete" to remove.
// It lights up yellow under the cursor, like a selected menu line.
export function GlyphLink({
  className = "",
  ...props
}: ComponentProps<typeof Link>) {
  return (
    <Link
      className={`px-1 font-mono text-meta tracking-wider text-muted uppercase transition-colors duration-75 ease-flick hover:bg-accent hover:text-accent-foreground ${className}`}
      {...props}
    />
  );
}
