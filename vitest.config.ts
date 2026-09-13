import { existsSync } from "node:fs";
import { defineConfig } from "vitest/config";

if (existsSync(".env")) {
  process.loadEnvFile(".env");
}

export default defineConfig({
  test: {
    // *.spec.ts belongs to Playwright.
    include: ["**/*.test.ts"],
    env: {
      // Tests never touch the dev database.
      DATABASE_URL: process.env.TEST_DATABASE_URL ?? "",
    },
    setupFiles: ["./test/setup.ts"],
  },
});
