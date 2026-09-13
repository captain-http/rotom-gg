import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "vitest";
import { parseLog } from "./parse-log";

// Every real log in test/fixtures/logs/ sits next to its expected parse.
const dir = join(import.meta.dirname, "../../test/fixtures/logs");
const fixtures = readdirSync(dir)
  .filter((file) => file.endsWith(".txt"))
  .map((file) => file.replace(/\.txt$/, ""));

test.each(fixtures)("%s", (name) => {
  const log = readFileSync(join(dir, `${name}.txt`), "utf8");
  const expected = JSON.parse(readFileSync(join(dir, `${name}.json`), "utf8"));

  expect(parseLog(log)).toEqual(expected);
});

test("a log without a winner has no result", () => {
  expect(parseLog("Turn 1")).toEqual({ result: null });
});
