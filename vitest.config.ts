import { existsSync } from "node:fs";
import { configDefaults, defineConfig } from "vitest/config";

if (existsSync(".env")) {
  process.loadEnvFile(".env");
}

export default defineConfig({
  test: {
    // *.spec.ts belongs to Playwright.
    include: ["**/*.test.ts"],
    // Claude Code worktrees are other checkouts of this repo.
    exclude: [...configDefaults.exclude, ".claude/worktrees/**"],
    env: {
      // Tests never touch the dev database.
      DATABASE_URL: process.env.TEST_DATABASE_URL ?? "",
    },
    setupFiles: ["./test/setup.ts"],
  },
});
