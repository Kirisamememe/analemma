import { afterAll, describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import {
  constants,
  mkdirSync,
  mkdtempSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const hooksDirectory = join(import.meta.dirname, "..");
const temporaryRoot = mkdtempSync(join(tmpdir(), "analemma-hooks-"));
const HOOKS = ["pre-commit", "pre-merge-commit", "commit-msg"];

afterAll(() => {
  rmSync(temporaryRoot, { recursive: true, force: true });
});

const git = (cwd: string, ...args: string[]) =>
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
      `core.hooksPath=${hooksDirectory}`,
      ...args,
    ],
    { cwd, encoding: "utf8" },
  );

const makeRepository = (name: string): string => {
  const root = join(temporaryRoot, name);

  mkdirSync(join(root, ".private"), { recursive: true });
  writeFileSync(
    join(root, ".private", "other-repositories.txt"),
    "hidden-repo",
  );
  writeFileSync(join(root, ".gitignore"), ".private/\n");
  git(root, "init", "--quiet");
  git(root, "add", ".gitignore");
  git(root, "commit", "--quiet", "--message", "chore: リポジトリを作る");

  return root;
};

const commitFile = (root: string, message: string) => {
  git(root, "add", "a.md");

  return git(root, "commit", "--quiet", "--message", message);
};

describe("git の hook", () => {
  test("hook のファイルに実行の権限があること", () => {
    expect(
      HOOKS.filter(
        (hook) =>
          (statSync(join(hooksDirectory, hook)).mode & constants.S_IXUSR) === 0,
      ),
    ).toEqual([]);
  });

  test("形が合い、ほかのリポジトリの名前が無ければ、コミットできること", () => {
    const root = makeRepository("passing");

    writeFileSync(join(root, "a.md"), "中身\n");

    expect(commitFile(root, "docs: 説明を書く").status).toBe(0);
  });

  test("ステージしたファイルにほかのリポジトリの名前があれば、コミットを止めること", () => {
    const root = makeRepository("staged-name");
    writeFileSync(join(root, "a.md"), "Hidden-Repo から写す\n");

    const result = commitFile(root, "docs: 説明を書く");

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("a.md:1: 「hidden-repo」");
  });

  test("メッセージにほかのリポジトリの名前があれば、コミットを止めること", () => {
    const root = makeRepository("message-name");
    writeFileSync(join(root, "a.md"), "中身\n");

    const result = commitFile(root, "docs: hidden-repo から写す");

    expect(result.status).toBe(1);
    expect(result.stderr).toContain(":1: 「hidden-repo」");
  });

  test("形の合わないメッセージなら、コミットを止めること", () => {
    const root = makeRepository("format");
    writeFileSync(join(root, "a.md"), "中身\n");

    const result = commitFile(root, "update stuff");

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("[type-empty]");
  });

  test("merge で取り込むファイルにほかのリポジトリの名前があれば、merge を止めること", () => {
    const root = makeRepository("merge");

    git(root, "checkout", "--quiet", "-b", "topic");
    writeFileSync(join(root, "a.md"), "hidden-repo\n");
    git(root, "add", "a.md");
    git(root, "commit", "--quiet", "--no-verify", "--message", "docs: 写す");
    git(root, "checkout", "--quiet", "main");

    const result = git(root, "merge", "--no-ff", "--no-edit", "topic");

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("a.md:1: 「hidden-repo」");
  });
});
