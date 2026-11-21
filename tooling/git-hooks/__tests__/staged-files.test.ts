import { afterAll, describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { readStagedFiles } from "../staged-files";

const temporaryRoot = mkdtempSync(join(tmpdir(), "analemma-staged-files-"));

afterAll(() => {
  rmSync(temporaryRoot, { recursive: true, force: true });
});

const git = (cwd: string, ...args: string[]): void => {
  const result = spawnSync(
    "git",
    [
      "-c",
      "init.defaultBranch=main",
      "-c",
      "user.name=test",
      "-c",
      "user.email=test@example.invalid",
      ...args,
    ],
    { cwd, encoding: "utf8" },
  );

  if (result.status !== 0) {
    throw new Error(`git ${args.join(" ")} が失敗した:${result.stderr}`);
  }
};

const makeRepository = (name: string): string => {
  const root = join(temporaryRoot, name);

  mkdirSync(root, { recursive: true });
  git(root, "init", "--quiet");

  return root;
};

const summary = (root: string): string[] =>
  readStagedFiles(root).map(({ path, text }) => `${path}: ${text}`);

describe("ステージしたファイルを読むこと", () => {
  test("まだコミットの無いリポジトリでも、ステージしたファイルを読むこと", () => {
    const root = makeRepository("unborn");

    writeFileSync(join(root, "a.ts"), "const a = 1;\n");
    git(root, "add", "a.ts");

    expect(summary(root)).toEqual(["a.ts: const a = 1;\n"]);
  });

  test("作業ツリーの中身でなく、ステージした中身を読むこと", () => {
    const root = makeRepository("partially-staged");

    writeFileSync(join(root, "a.md"), "ステージした中身\n");
    git(root, "add", "a.md");
    writeFileSync(join(root, "a.md"), "ステージしていない中身\n");

    expect(summary(root)).toEqual(["a.md: ステージした中身\n"]);
  });

  test("消したファイルを除き、名前を変えたファイルは新しいパスで読むこと", () => {
    const root = makeRepository("removed-and-renamed");

    writeFileSync(join(root, "removed.md"), "消す\n");
    writeFileSync(join(root, "old.md"), "名前を変える\n");
    git(root, "add", ".");
    git(root, "commit", "--quiet", "--message", "init");
    git(root, "rm", "--quiet", "removed.md");
    git(root, "mv", "old.md", "new.md");

    expect(summary(root)).toEqual(["new.md: 名前を変える\n"]);
  });

  test("ステージしていないファイルは読まないこと", () => {
    const root = makeRepository("unstaged");

    writeFileSync(join(root, "a.md"), "コミットした中身\n");
    git(root, "add", "a.md");
    git(root, "commit", "--quiet", "--message", "init");
    writeFileSync(join(root, "a.md"), "変えた中身\n");
    writeFileSync(join(root, "b.md"), "足した中身\n");

    expect(summary(root)).toEqual([]);
  });

  test("日本語と空白を含むパスと、symbolic link を読むこと", () => {
    const root = makeRepository("names");

    mkdirSync(join(root, "フォルダ"));
    writeFileSync(join(root, "フォルダ", "a b.md"), "中身\n");
    symlinkSync("フォルダ/a b.md", join(root, "link"));
    git(root, "add", ".");

    expect(summary(root)).toEqual([
      "link: フォルダ/a b.md",
      "フォルダ/a b.md: 中身\n",
    ]);
  });
});
