import Link from "next/link";
import type { ComponentProps } from "react";

const BUTTON =
  "inline-block border-2 border-border bg-surface px-4 py-2 text-center text-body font-semibold text-surface-foreground transition-colors duration-75 ease-flick hover:border-accent hover:bg-accent hover:text-accent-foreground focus-visible:border-accent disabled:border-rule disabled:bg-surface disabled:text-muted";

// A framed button that fills yellow under the cursor. Spreads props so
// wrappers like Clerk's <SignInButton> can attach handlers.
export function Button({ className = "", ...props }: ComponentProps<"button">) {
  return (
    <button type="button" className={`${BUTTON} ${className}`} {...props} />
  );
}

// A link that looks like a Button, for actions that open a page ("+ Add game").
export function ButtonLink({
  className = "",
  ...props
}: ComponentProps<typeof Link>) {
  return <Link className={`${BUTTON} ${className}`} {...props} />;
}
