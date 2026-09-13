import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "vitest";
import * as gameLog from "./game-log";

// Every real log in test/fixtures/logs/ sits next to its expected summary.
const dir = join(import.meta.dirname, "../../test/fixtures/logs");
const fixtures = readdirSync(dir)
  .filter((file) => file.endsWith(".txt"))
  .map((file) => file.replace(/\.txt$/, ""));

test.each(fixtures)("%s", (name) => {
  const log = readFileSync(join(dir, `${name}.txt`), "utf8");
  const expected = JSON.parse(readFileSync(join(dir, `${name}.json`), "utf8"));

  expect(gameLog.summarize(log)).toEqual(expected);
});

test("a log without a winner has no result", () => {
  expect(gameLog.findWinner("Turn 1")).toBeUndefined();
  expect(gameLog.summarize("Turn 1")).toEqual({ result: null });
});
