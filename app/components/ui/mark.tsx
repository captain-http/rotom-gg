import type { ReactNode } from "react";

const TONES = {
  win: "bg-win text-win-foreground",
  loss: "bg-loss text-loss-foreground",
  neutral: "border border-border text-muted",
};

// A highlighter block around a short uppercase label: results and records.
export function Mark({
  tone,
  children,
}: {
  tone: keyof typeof TONES;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-block px-1 text-meta tracking-wider uppercase ${TONES[tone]}`}
    >
      {children}
    </span>
  );
}
