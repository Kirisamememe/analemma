import { expect, test } from "bun:test";
import { readFile } from "node:fs/promises";

test("テストは Bun で動くので、Node の API でファイルを読めること", async () => {
  expect(await readFile(new URL(import.meta.url), "utf8")).toContain("test(");
  expect(typeof Bun.version).toBe("string");
});
