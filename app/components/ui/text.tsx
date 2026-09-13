import type { ReactNode } from "react";

// A page heading on a highlight block.
export function Heading({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <h1
      className={`self-start bg-highlight px-1 text-heading text-highlight-foreground ${className}`}
    >
      {children}
    </h1>
  );
}

// Small uppercase muted text: section labels, empty states, facts.
export function Caption({
  as: Tag = "p",
  children,
  className = "",
  htmlFor,
}: {
  as?: "p" | "span" | "h2" | "label";
  children: ReactNode;
  className?: string;
  htmlFor?: string;
}) {
  return (
    <Tag
      className={`text-meta tracking-wider text-muted uppercase ${className}`}
      {...(Tag === "label" ? { htmlFor } : {})}
    >
      {children}
    </Tag>
  );
}
