import type { ReactNode } from "react";

// The box everything sits in: a 2px frame on the surface, opaque over the
// scanlines, with an optional title cut into its top edge. Pass flush for a
// Menu, whose rows run to the frame.
export function Panel({
  title,
  flush,
  children,
  className = "",
}: {
  title?: ReactNode;
  flush?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`relative border-2 border-border bg-surface text-surface-foreground ${flush ? "pt-2" : "flex flex-col gap-3 p-4"} ${className}`}
    >
      {title && (
        <h2 className="panel-title font-mono text-meta tracking-wider text-muted uppercase">
          {title}
        </h2>
      )}
      {children}
    </section>
  );
}
