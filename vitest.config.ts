import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // *.spec.ts belongs to Playwright.
    include: ["**/*.test.ts"],
  },
});
