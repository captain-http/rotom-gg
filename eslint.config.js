import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import rotomDesign from "./eslint-rules/design-classes.js";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // The design language from .claude/skills/rotom-design/SKILL.md.
  {
    files: ["app/**/*.{ts,tsx}"],
    plugins: { "rotom-design": rotomDesign },
    rules: { "rotom-design/design-classes": "error" },
  },
  // Boundary rules from docs/decisions.md.
  {
    files: ["app/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              regex: "(^|/)lib/db(/|$)",
              message: "app/ reads through lib/domain/, never lib/db.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["lib/domain/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              regex: "^(next|@clerk|server-only)(/|$)",
              message:
                "lib/domain/ is framework-free: no next/*, @clerk/*, or server-only.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["**/*.test.{ts,tsx}", "**/*.spec.{ts,tsx}"],
    rules: {
      "no-restricted-properties": [
        "error",
        {
          object: "vi",
          property: "mock",
          message: "Never mock modules we own. Use a real database.",
        },
        {
          object: "vi",
          property: "doMock",
          message: "Never mock modules we own. Use a real database.",
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
