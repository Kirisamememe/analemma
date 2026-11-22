import { afterAll, describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import { findChangedFiles } from "../changed-files";

const temporaryRoot = mkdtempSync(join(tmpdir(), "analemma-check-"));

afterAll(() => {
  rmSync(temporaryRoot, { recursive: true, force: true });
});

const git = (cwd: string, ...args: string[]): string =>
  spawnSync(
    "git",
    [
      "-c",
      "init.defaultBranch=main",
      "-c",
      "user.name=test",
      "-c",
      "user.email=test@example.invalid",
      "-c",
      "core.hooksPath=/dev/null",
      ...args,
    ],
    { cwd, encoding: "utf8" },
  ).stdout;

/** 書くファイル。 */
type FileToWrite = {
  /** リポジトリの中のパス。 */
  readonly path: string;
  /** 中身。 */
  readonly text?: string;
};

const write = (
  root: string,
  { path, text = `${path}\n` }: FileToWrite,
): void => {
  mkdirSync(join(root, dirname(path)), { recursive: true });
  writeFileSync(join(root, path), text);
};

const commit = (root: string, path: string): void => {
  write(root, { path });
  git(root, "add", path);
  git(root, "commit", "--quiet", "--message", `chore: ${path}`);
};

const makeRepository = (name: string): string => {
  const root = join(temporaryRoot, name);

  mkdirSync(root);
  git(root, "init", "--quiet");
  commit(root, "README.md");

  return root;
};

describe("findChangedFiles", () => {
  test("一番近いフェーズのブランチから分かれた後の、コミット・ステージ・作業ツリーで変えたファイルと、untracked のファイルのパスを返す", () => {
    const root = makeRepository("phase");

    git(root, "update-ref", "refs/remotes/origin/main", "HEAD");
    commit(root, "apps/server/src/app.ts");
    git(root, "update-ref", "refs/remotes/origin/phase/1", "HEAD");
    commit(root, "apps/admin/src/committed.ts");
    write(root, { path: "apps/admin/src/staged.ts" });
    git(root, "add", "apps/admin/src/staged.ts");
    write(root, { path: "README.md", text: "書き換えた\n" });
    write(root, { path: "apps/admin/src/新しいファイル.ts" });

    expect(findChangedFiles(root)?.toSorted()).toEqual([
      "README.md",
      "apps/admin/src/committed.ts",
      "apps/admin/src/staged.ts",
      "apps/admin/src/新しいファイル.ts",
    ]);
  });

  test("コミットした変更を、作業ツリーで分かれた点の中身に戻したファイルは返さない", () => {
    const root = makeRepository("reverted");

    commit(root, "apps/server/src/app.ts");
    git(root, "update-ref", "refs/remotes/origin/main", "HEAD");
    write(root, { path: "apps/server/src/app.ts", text: "書き換えた\n" });
    git(root, "commit", "--quiet", "--all", "--message", "chore: 書き換える");
    write(root, { path: "apps/server/src/app.ts" });

    expect(findChangedFiles(root)).toEqual([]);
  });

  test("ファイルを移したら、移す前のパスも返す", () => {
    const root = makeRepository("rename");

    commit(root, "apps/server/src/moved.ts");
    git(root, "update-ref", "refs/remotes/origin/main", "HEAD");
    mkdirSync(join(root, "apps/admin"), { recursive: true });
    git(root, "mv", "apps/server/src/moved.ts", "apps/admin/moved.ts");

    expect(findChangedFiles(root)).toContain("apps/server/src/moved.ts");
  });

  test("main もフェーズのブランチも無ければ、分からないとする", () => {
    const root = makeRepository("no-base");

    write(root, { path: "apps/admin/src/a.ts" });

    expect(findChangedFiles(root)).toBeUndefined();
  });
});
