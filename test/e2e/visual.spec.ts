import { expect, test } from "@playwright/test";

// Visual regression for the design language. A failure means the look
// changed: if it was intended, review the diff in playwright-report/ and run
// `pnpm exec playwright test test/e2e/visual.spec.ts --update-snapshots`,
// then commit the new images.

const pages = [
  { name: "home", path: "/" },
  { name: "styleguide", path: "/styleguide" },
];
const viewports = [
  { name: "mobile", width: 390, height: 844 },
  { name: "desktop", width: 1280, height: 800 },
];
const schemes = ["light", "dark"] as const;

for (const { name, path } of pages) {
  for (const viewport of viewports) {
    for (const colorScheme of schemes) {
      test(`${name} ${viewport.name} ${colorScheme}`, async ({ page }) => {
        await page.setViewportSize(viewport);
        await page.emulateMedia({ colorScheme, reducedMotion: "reduce" });
        await page.goto(path);
        await page.evaluate(() => document.fonts.ready);

        await expect(page).toHaveScreenshot(
          `${name}-${viewport.name}-${colorScheme}.png`,
          { fullPage: true, animations: "disabled" },
        );
      });
    }
  }
}
