import { afterAll, describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { findMainCheckout, loadPrivateNames } from "../private-name-list";

const temporaryRoot = mkdtempSync(join(tmpdir(), "analemma-search-lists-"));

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

const makeDirectory = (name: string): string => {
  const directory = join(temporaryRoot, name);

  mkdirSync(directory, { recursive: true });

  return directory;
};

describe("ほかのリポジトリの名前の一覧を読むこと", () => {
  test("メインの checkout の .private/other-repositories.txt を読むこと", () => {
    const main = makeDirectory("main");

    git(main, "init", "--quiet");
    mkdirSync(join(main, ".private"));
    writeFileSync(
      join(main, ".private", "other-repositories.txt"),
      "# 説明\nhidden-repo\n",
    );

    expect(loadPrivateNames(main)).toEqual(["hidden-repo"]);
  });

  test("worktree からは、メインの checkout の一覧を読むこと", () => {
    const main = makeDirectory("worktree-main");
    const worktree = join(temporaryRoot, "worktree-other");

    git(main, "init", "--quiet");
    git(main, "commit", "--quiet", "--allow-empty", "--message", "init");
    git(main, "worktree", "add", "--quiet", worktree);
    mkdirSync(join(main, ".private"));
    writeFileSync(join(main, ".private", "other-repositories.txt"), "隠し庫");

    expect(loadPrivateNames(worktree)).toEqual(["隠し庫"]);
  });

  test("一覧が無いときは、名前を1つも返さないこと", () => {
    const main = makeDirectory("no-list");

    git(main, "init", "--quiet");

    expect(loadPrivateNames(main)).toEqual([]);
  });

  test("git のリポジトリの外では、黙って空にせず失敗すること", () => {
    expect(() => loadPrivateNames(makeDirectory("outside"))).toThrow(
      "git rev-parse --git-common-dir が失敗した",
    );
  });
});

describe("メインの checkout を探すこと", () => {
  test("worktree の中からでも、メインの checkout の直下を返すこと", () => {
    const main = makeDirectory("find-main");
    const worktree = join(temporaryRoot, "find-main-worktree");

    git(main, "init", "--quiet");
    git(main, "commit", "--quiet", "--allow-empty", "--message", "init");
    git(main, "worktree", "add", "--quiet", worktree);

    expect(findMainCheckout(worktree)).toBe(realpathSync(main));
    expect(findMainCheckout(main)).toBe(realpathSync(main));
  });
});
