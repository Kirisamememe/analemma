import { describe, expect, test } from "bun:test";

import { decideTestScope } from "../test-scope";

describe("decideTestScope", () => {
  test.each([
    ["apps/server/src/app.ts"],
    ["packages/contract/src/index.ts"],
    ["compose.yaml"],
    ["bun.lock"],
    ["bunfig.toml"],
    ["tsconfig.base.json"],
  ])("%s に触れたら、server のテストも流す", (path) => {
    expect(
      decideTestScope({
        all: false,
        changedFiles: ["apps/admin/src/app/main.tsx", path],
      }),
    ).toBe("all");
  });

  test("server のテストが読む場所に触れていなければ、server のテストを流さない", () => {
    expect(
      decideTestScope({
        all: false,
        changedFiles: [
          "apps/admin/src/app/main.tsx",
          "tooling/check/check.ts",
          "apps/server-notes.md",
          "README.md",
        ],
      }),
    ).toBe("without-server");
  });

  test("--all を付けたら、server に触れていなくても server のテストを流す", () => {
    expect(
      decideTestScope({
        all: true,
        changedFiles: ["apps/admin/src/app/main.tsx"],
      }),
    ).toBe("all");
  });

  test("変えたファイルが分からなければ、server のテストも流す", () => {
    expect(decideTestScope({ all: false, changedFiles: undefined })).toBe(
      "all",
    );
  });
});
