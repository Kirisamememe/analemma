import { spawnSync } from "node:child_process";

const BASE_REFS = ["refs/remotes/origin/main", "refs/remotes/origin/phase"];

const git = (cwd: string, args: readonly string[]): string | undefined => {
  const result = spawnSync("git", args, {
    cwd,
    encoding: "utf8",
    maxBuffer: Number.POSITIVE_INFINITY,
  });

  return result.status === 0 ? result.stdout : undefined;
};

const entriesOf = (output: string, separator: string): string[] =>
  output.split(separator).filter((entry) => entry !== "");

const countAhead = (cwd: string, ref: string): number | undefined => {
  const count = git(cwd, ["rev-list", "--count", `${ref}..HEAD`]);

  return count === undefined ? undefined : Number(count.trim());
};

const findNearestBase = (cwd: string): string | undefined =>
  entriesOf(
    git(cwd, ["for-each-ref", "--format=%(refname)", ...BASE_REFS]) ?? "",
    "\n",
  )
    .flatMap((ref) => {
      const ahead = countAhead(cwd, ref);

      return ahead === undefined ? [] : [{ ref, ahead }];
    })
    .toSorted((left, right) => left.ahead - right.ahead)[0]?.ref;

/** 一番近いフェーズのブランチか main から分かれた後に、変えたファイル。 */
export const findChangedFiles = (
  cwd: string,
): readonly string[] | undefined => {
  const base = findNearestBase(cwd);
  const forkPoint =
    base === undefined ? undefined : git(cwd, ["merge-base", base, "HEAD"]);

  if (forkPoint === undefined) {
    return undefined;
  }

  const changed = git(cwd, [
    "diff",
    "--name-only",
    "-z",
    "--no-renames",
    forkPoint.trim(),
  ]);
  const untracked = git(cwd, [
    "ls-files",
    "-z",
    "--others",
    "--exclude-standard",
  ]);

  return changed === undefined || untracked === undefined
    ? undefined
    : [...entriesOf(changed, "\0"), ...entriesOf(untracked, "\0")];
};
