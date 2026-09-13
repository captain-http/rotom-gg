import type { ComponentProps } from "react";

// The inverse panel with an uppercase label; turns amber on hover. Spreads
// props so wrappers like Clerk's <SignInButton> can attach handlers.
export function Button({ className = "", ...props }: ComponentProps<"button">) {
  return (
    <button
      type="button"
      className={`bg-inverse px-4 py-2 text-body tracking-wider text-inverse-foreground uppercase transition-colors duration-150 ease-flick hover:bg-accent hover:text-accent-foreground ${className}`}
      {...props}
    />
  );
}
