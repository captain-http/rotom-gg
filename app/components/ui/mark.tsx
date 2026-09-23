import type { ReactNode } from "react";

const TONES = {
  win: "border-win bg-win text-win-foreground",
  loss: "border-loss bg-loss text-loss-foreground",
  neutral: "border-border text-muted",
};

// A small mono block around a short uppercase label: results and records.
export function Mark({
  tone,
  children,
}: {
  tone: keyof typeof TONES;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-block border px-1 font-mono text-meta tracking-wider uppercase ${TONES[tone]}`}
    >
      {children}
    </span>
  );
}
