import Link from "next/link";
import type { ComponentProps } from "react";

const BUTTON =
  "inline-block bg-inverse px-4 py-2 text-body tracking-wider text-inverse-foreground uppercase transition-colors duration-150 ease-flick hover:bg-accent hover:text-accent-foreground";

// The inverse panel with an uppercase label; turns amber on hover. Spreads
// props so wrappers like Clerk's <SignInButton> can attach handlers.
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
