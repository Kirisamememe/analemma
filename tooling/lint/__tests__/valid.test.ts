import { expect, test } from "bun:test";
import { readdirSync } from "node:fs";
import { join } from "node:path";

import { lintedFixtureCount, lintFixture } from "../fixture-lint";

const fixtureFiles = readdirSync(join(import.meta.dirname, "../fixtures"), {
  recursive: true,
  withFileTypes: true,
}).filter((entry) => entry.isFile());

test("ルールに適合する fixture を lint し、1件も診断を出さないこと", () => {
  const result = lintFixture("valid");

  expect(result.diagnostics).toEqual([]);
  expect(result.status).toBe(0);
});

test("fixture を1つも飛ばさずに lint すること", () => {
  expect(lintedFixtureCount()).toBe(fixtureFiles.length);
});

test("無い fixture を渡したら、空の結果を返さずに失敗すること", () => {
  expect(() => lintFixture("valid/no-such-fixture.ts")).toThrow(
    "fixture が見つからない",
  );
});
