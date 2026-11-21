import { spawnSync } from "node:child_process";

import type { SourceFile } from "../structure/source-file";

const git = (cwd: string, args: readonly string[]): Buffer => {
  const result = spawnSync("git", args, {
    cwd,
    maxBuffer: Number.POSITIVE_INFINITY,
  });

  if (result.status !== 0) {
    throw new Error(
      `git ${args.join(" ")} が失敗した:${result.stderr.toString()}`,
    );
  }

  return result.stdout;
};

/** ステージしたファイルを、ステージした中身と一緒に読む。 */
export const readStagedFiles = (cwd: string): SourceFile[] =>
  git(cwd, [
    "diff",
    "--cached",
    "--name-only",
    "-z",
    "--no-renames",
    "--diff-filter=d",
  ])
    .toString("utf8")
    .split("\0")
    .filter((path) => path !== "")
    .map((path) => ({
      path,
      text: git(cwd, ["cat-file", "blob", `:${path}`]).toString("utf8"),
    }));
