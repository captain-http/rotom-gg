import type { CSSProperties, ReactNode } from "react";

// A list item that steps in on load, a beat after the one before it.
export function Reveal({
  index,
  children,
  className = "",
}: {
  index: number;
  children: ReactNode;
  className?: string;
}) {
  return (
    <li
      className={`animate-reveal [animation-delay:calc(var(--i)*60ms)] ${className}`}
      style={{ "--i": index } as CSSProperties}
    >
      {children}
    </li>
  );
}
