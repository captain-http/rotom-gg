import { db as defaultDb, type Db } from "../db";
import { waitlist } from "../db/schema";

export type WaitlistEntry = typeof waitlist.$inferSelect;

/**
 * Normalizes an address the way the waitlist stores it, so that " A@B.COM "
 * and "a@b.com" are one person rather than two rows.
 *
 * @param email - The address as it was typed.
 * @returns The address trimmed and lowercased.
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Adds an address to the waitlist, leaving one that is already on it alone.
 *
 * Signing up twice is not an error, and the result doesn't say which case it
 * was: the form can't be used to find out whether an address has signed up.
 *
 * @param input - The address to add, normalized before it is stored.
 * @param db - The database or a transaction; defaults to the shared client.
 */
export async function joinWaitlist(
  input: { email: string },
  db: Db = defaultDb,
): Promise<void> {
  await db
    .insert(waitlist)
    .values({ email: normalizeEmail(input.email) })
    .onConflictDoNothing({ target: waitlist.email });
}
