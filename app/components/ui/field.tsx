import type { ComponentProps } from "react";

const FIELD =
  "border-2 border-border bg-surface px-3 py-2 text-body text-surface-foreground placeholder:text-muted focus-visible:border-accent";

// Text inputs sit on a paper sheet. 16.5px text also keeps iOS from zooming.
export function Input({ className = "", ...props }: ComponentProps<"input">) {
  return <input className={`${FIELD} ${className}`} {...props} />;
}

export function Textarea({
  className = "",
  ...props
}: ComponentProps<"textarea">) {
  return <textarea className={`${FIELD} ${className}`} {...props} />;
}
