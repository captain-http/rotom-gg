import { expect, test } from "vitest";
import { withRollback } from "../../test/db";
import { waitlist } from "../db/schema";
import { joinWaitlist, normalizeEmail } from "./waitlist";

test("normalizeEmail trims and lowercases", () => {
  expect(normalizeEmail("  Red@Example.COM ")).toBe("red@example.com");
});

test("joinWaitlist stores the address", () =>
  withRollback(async (db) => {
    await joinWaitlist({ email: "red@example.com" }, db);

    expect(await db.select().from(waitlist)).toMatchObject([
      { email: "red@example.com" },
    ]);
  }));

test("joinWaitlist stores the address normalized", () =>
  withRollback(async (db) => {
    await joinWaitlist({ email: "  Red@Example.COM " }, db);

    expect(await db.select().from(waitlist)).toMatchObject([
      { email: "red@example.com" },
    ]);
  }));

test("joining twice leaves one row and doesn't throw", () =>
  withRollback(async (db) => {
    await joinWaitlist({ email: "red@example.com" }, db);
    await joinWaitlist({ email: "RED@EXAMPLE.COM" }, db);

    expect(await db.select().from(waitlist)).toHaveLength(1);
  }));
