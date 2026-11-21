import { expect, test } from "bun:test";
import { readdirSync } from "node:fs";
import { join } from "node:path";

import { lintFixture } from "../fixture-lint";

const validFiles = readdirSync(join(import.meta.dirname, "../fixtures/valid"), {
  recursive: true,
  withFileTypes: true,
}).filter((entry) => entry.isFile());

test("ルールに適合する fixture を全部 lint し、1件も診断を出さないこと", () => {
  const result = lintFixture("valid");

  expect(result.files).toBe(validFiles.length);
  expect(result.diagnostics).toEqual([]);
  expect(result.status).toBe(0);
});
