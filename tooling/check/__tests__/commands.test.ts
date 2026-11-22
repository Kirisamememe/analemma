import { afterAll, describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import { buildCommands, readIgnorePatterns } from "../commands";

const temporaryRoot = mkdtempSync(join(tmpdir(), "analemma-check-commands-"));

afterAll(() => {
  rmSync(temporaryRoot, { recursive: true, force: true });
});

const write = (path: string, text: string): void => {
  mkdirSync(join(temporaryRoot, dirname(path)), { recursive: true });
  writeFileSync(join(temporaryRoot, path), text);
};

const PASSING = 'import { test } from "bun:test";\n\ntest("通る", () => {});\n';
const FAILING =
  'import { test } from "bun:test";\n\ntest("流れたら落ちる", () => {\n  throw new Error("流れた");\n});\n';

describe("buildCommands", () => {
  test("整形の確認・lint・型検査を、テストの前に流す", () => {
    expect(buildCommands("all", []).slice(0, 3)).toEqual([
      ["bun", "run", "format:check"],
      ["bun", "run", "lint"],
      ["bun", "run", "typecheck"],
    ]);
  });

  test("全部を流すときは、テスト用の PostgreSQL を用意する `bun run test` を流す", () => {
    expect(buildCommands("all", []).slice(3)).toEqual([["bun", "run", "test"]]);
  });

  test("server を除くときは、bunfig.toml で外したテストも、apps/server のテストも流さず、ほかのテストと管理画面のテストを流す", () => {
    write("bunfig.toml", '[test]\npathIgnorePatterns = ["fixtures/**"]\n');
    write("fixtures/fixture.test.ts", FAILING);
    write("apps/server/src/server.test.ts", FAILING);
    write("tooling/tooling.test.ts", PASSING);

    const bunfig: unknown = Bun.TOML.parse(
      '[test]\npathIgnorePatterns = ["fixtures/**"]\n',
    );
    const [rootTests, adminTests] = buildCommands(
      "without-server",
      readIgnorePatterns(bunfig),
    ).slice(3);
    const result = spawnSync(rootTests?.[0] ?? "", rootTests?.slice(1) ?? [], {
      cwd: temporaryRoot,
      encoding: "utf8",
    });

    expect(result.stderr).toContain("1 pass");
    expect(result.status).toBe(0);
    expect(adminTests).toEqual(["bun", "--cwd=apps/admin", "run", "test"]);
  });
});

describe("readIgnorePatterns", () => {
  test("[test] の pathIgnorePatterns の文字列だけを読む", () => {
    expect(
      readIgnorePatterns({ test: { pathIgnorePatterns: ["a/**", 1, "b/**"] } }),
    ).toEqual(["a/**", "b/**"]);
  });

  test("[test] や pathIgnorePatterns が無ければ、空にする", () => {
    expect(readIgnorePatterns({})).toEqual([]);
    expect(readIgnorePatterns({ test: {} })).toEqual([]);
  });

  test("リポジトリの bunfig.toml から、管理画面の src の除外を読む", async () => {
    const bunfig: unknown = Bun.TOML.parse(
      await Bun.file(join(import.meta.dirname, "../../../bunfig.toml")).text(),
    );

    expect(readIgnorePatterns(bunfig)).toContain("apps/admin/src/**");
  });
});
