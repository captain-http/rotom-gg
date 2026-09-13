import { expect, test } from "@playwright/test";

test("decks requires sign-in", async ({ request }) => {
  const response = await request.get("/decks", { maxRedirects: 0 });
  expect(response.status()).not.toBe(200);
  expect(await response.text()).not.toContain("Signed in as");
});
