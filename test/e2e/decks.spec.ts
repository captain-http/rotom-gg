import { expect, test } from "@playwright/test";

test("decks requires sign-in", async ({ request }) => {
  const response = await request.get("/decks", { maxRedirects: 0 });
  expect(response.status()).not.toBe(200);
  expect(await response.text()).not.toContain("Create deck");
});

test("a deck requires sign-in", async ({ request }) => {
  const response = await request.get("/decks/1", { maxRedirects: 0 });
  expect(response.status()).not.toBe(200);
  expect(await response.text()).not.toContain("Add game");
});
