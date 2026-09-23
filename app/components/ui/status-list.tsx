import type { ReactNode } from "react";

const TONES = {
  // Green means something went right, as it does for a win: a block, since
  // green is too light to read as small text on the light panel.
  ok: "bg-win px-1 text-win-foreground",
  orange: "text-spectrum-orange",
  blue: "text-spectrum-blue",
  purple: "text-spectrum-purple",
  plain: "",
};

export type StatusLine = {
  key: string;
  value: ReactNode;
  tone?: keyof typeof TONES;
};

// Status lines, like a terminal's: muted keys in a column, values colored by
// kind the way an editor colors code. Keys and values are mono and uppercase.
export function StatusList({ lines }: { lines: StatusLine[] }) {
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1 font-mono text-meta tracking-wider uppercase">
      {lines.map(({ key, value, tone = "plain" }) => (
        <div key={key} className="contents">
          <dt className="text-muted">{key}</dt>
          <dd>
            <span className={TONES[tone]}>{value}</span>
          </dd>
        </div>
      ))}
    </dl>
  );
}
