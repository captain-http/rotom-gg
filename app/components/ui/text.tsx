import type { ReactNode } from "react";

// A page heading in Plex Mono semibold: the business, read first.
export function Heading({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <h1 className={`text-heading font-semibold ${className}`}>{children}</h1>
  );
}

// A mono label, uppercase and muted: section labels, facts, status lines.
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
      className={`font-mono text-meta tracking-wider text-muted uppercase ${className}`}
      {...(Tag === "label" ? { htmlFor } : {})}
    >
      {children}
    </Tag>
  );
}
