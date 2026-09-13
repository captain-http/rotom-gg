import { expect, test } from "@playwright/test";

// Signed out, each page redirects to sign-in and renders none of its content.
const pages = [
  { path: "/decks", content: 'name="title"' },
  { path: "/decks/1", content: "Games on file" },
  { path: "/decks/1/games/new", content: 'name="log"' },
];

for (const { path, content } of pages) {
  test(`${path} requires sign-in`, async ({ request }) => {
    const response = await request.get(path, { maxRedirects: 0 });
    expect(response.status()).not.toBe(200);
    expect(await response.text()).not.toContain(content);
  });
}
