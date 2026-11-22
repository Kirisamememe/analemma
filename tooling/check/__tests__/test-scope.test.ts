import { describe, expect, test } from "bun:test";

import { decideTestScope } from "../test-scope";

describe("decideTestScope", () => {
  test.each([
    ["apps/server/src/app.ts"],
    ["packages/contract/src/index.ts"],
    ["compose.yaml"],
  ])("%s に触れたら、server のテストも流す", (path) => {
    expect(decideTestScope(["apps/admin/src/main.tsx", path])).toBe("all");
  });

  test("apps/server/・packages/・compose.yaml に触れていなければ、server のテストを流さない", () => {
    expect(
      decideTestScope([
        "apps/admin/src/main.tsx",
        "tooling/check/check.ts",
        "apps/server-notes.md",
        "README.md",
      ]),
    ).toBe("without-server");
  });

  test("変えたファイルが分からなければ、server のテストも流す", () => {
    expect(decideTestScope(undefined)).toBe("all");
  });
});
