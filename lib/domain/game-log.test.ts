import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import * as gameLog from "./game-log";

// Every real log in test/fixtures/logs/ sits next to a JSON file mapping each
// gameLog function to its expected return value (null for undefined).
const dir = join(import.meta.dirname, "../../test/fixtures/logs");
const fixtures = readdirSync(dir)
  .filter((file) => file.endsWith(".txt"))
  .map((file) => file.replace(/\.txt$/, ""));

describe.each(fixtures)("%s", (name) => {
  const log = readFileSync(join(dir, `${name}.txt`), "utf8");
  const expected: Record<string, unknown> = JSON.parse(
    readFileSync(join(dir, `${name}.json`), "utf8"),
  );

  test("covers every gameLog function", () => {
    expect(Object.keys(expected).sort()).toEqual(Object.keys(gameLog).sort());
  });

  test.each(Object.entries(expected))("%s", (fn, value) => {
    const run = gameLog[fn as keyof typeof gameLog];
    expect(run(log) ?? null).toEqual(value);
  });
});

test("a log that says nothing summarizes to nulls", () => {
  expect(gameLog.findWinner("Turn 1")).toBeUndefined();
  expect(gameLog.summarize("Turn 1")).toEqual({
    result: null,
    wonCoinToss: null,
    coinTossChoice: null,
    wentFirst: null,
  });
});
