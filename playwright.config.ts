import { defineConfig, devices } from "@playwright/test";

const baseURL = "http://localhost:3000";

export default defineConfig({
  testDir: "./test/e2e",
  use: {
    baseURL,
    headless: true,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "pnpm exec next dev",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
  },
});
