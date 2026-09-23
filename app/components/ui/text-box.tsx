import type { ReactNode } from "react";

// A message from the app — a confirmation, an empty state, an error — in the
// Game Boy's text box: a framed line of plain words, ending on a blinking ▼.
export function TextBox({
  children,
  role,
  className = "",
}: {
  children: ReactNode;
  role?: "status" | "alert";
  className?: string;
}) {
  return (
    <p
      role={role}
      className={`flex items-end justify-between gap-3 border-2 border-border bg-surface px-4 py-3 text-surface-foreground ${className}`}
    >
      <span>{children}</span>
      <span
        aria-hidden
        className="animate-blink font-mono text-meta text-accent"
      >
        ▼
      </span>
    </p>
  );
}
