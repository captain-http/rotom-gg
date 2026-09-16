/** The scopes the MCP server asks a connecting client to be granted. */
export const MCP_SCOPES = ["openid", "offline_access"];

/**
 * The issuer URL of the Clerk instance acting as our authorization server.
 *
 * Clerk encodes its frontend API domain in the publishable key, so this works
 * for the development and production instances without another env var.
 *
 * @returns The issuer URL, e.g. "https://clerk.rotom.gg".
 * @throws When the publishable key is missing or not a Clerk key.
 */
export function getClerkIssuer(): string {
  const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  if (!key) {
    throw new Error("Missing NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY");
  }

  const encoded = key.replace(/^pk_(test|live)_/, "");
  if (encoded === key) {
    throw new Error("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is not a Clerk key");
  }

  // Base64url, and Clerk terminates the domain with a "$".
  const domain = atob(encoded.replace(/-/g, "+").replace(/_/g, "/")).replace(
    /\$$/,
    "",
  );
  return `https://${domain}`;
}
