import { spawnSync } from "node:child_process";

import type { ReviewArguments } from "./arguments";

/** 固定したレビュー対象のコミットの SHA、レビューするブランチの名前、結果のフォルダに使うブランチの名前。 */
type PinnedHead = {
  /** レビューするコミットの SHA。 */
  readonly head: string;
  /** レビューするブランチの名前。 */
  readonly headBranch: string | undefined;
  /** 結果のフォルダに使うブランチの名前。 */
  readonly resultsBranch: string;
};

/** 比べる元とレビュー対象のコミットの SHA で固定した範囲。 */
export type PinnedRange = PinnedHead & {
  /** 比べる元のコミットの SHA。 */
  readonly base: string;
};

const git = (cwd: string, ...args: string[]) =>
  spawnSync("git", args, { cwd, encoding: "utf8" });

const readGit = (cwd: string, ...args: string[]): string | undefined => {
  const result = git(cwd, ...args);

  return result.status === 0 ? result.stdout.trim() : undefined;
};

const currentBranch = (cwd: string): string | undefined =>
  readGit(cwd, "branch", "--show-current") || undefined;

const resolveRevision = (cwd: string, revision: string): string | undefined =>
  readGit(
    cwd,
    "rev-parse",
    "--verify",
    "--quiet",
    "--end-of-options",
    revision,
  );

const resolveCommit = (cwd: string, revision: string): string | undefined => {
  if (!revision.startsWith(":/")) {
    return resolveRevision(cwd, `${revision}^{commit}`);
  }

  const sha = resolveRevision(cwd, revision);

  return sha === undefined
    ? undefined
    : resolveRevision(cwd, `${sha}^{commit}`);
};

const branchCommit = (cwd: string, ref: string): string | undefined =>
  readGit(cwd, "show-ref", "--verify", "--hash", "--", ref);

const isBehindOrigin = (cwd: string, base: string): boolean => {
  const local = branchCommit(cwd, `refs/heads/${base}`);
  const remote = branchCommit(cwd, `refs/remotes/origin/${base}`);

  return (
    local !== undefined &&
    remote !== undefined &&
    local !== remote &&
    git(cwd, "merge-base", "--is-ancestor", local, remote).status === 0
  );
};

const pinHead = (
  cwd: string,
  head: string | undefined,
): PinnedHead | string => {
  const branch = head ?? currentBranch(cwd);

  if (branch === undefined) {
    return "今のブランチが無い(detached HEAD)。--head に手元のブランチを渡してください。";
  }

  const headCommit = branchCommit(cwd, `refs/heads/${branch}`);

  if (headCommit !== undefined) {
    return { head: headCommit, headBranch: branch, resultsBranch: branch };
  }

  if (head === undefined) {
    return `今のブランチ ${branch} にコミットが無い。`;
  }

  const commit = resolveCommit(cwd, head);

  if (commit === undefined) {
    return `手元にブランチ ${head} が無く、${head} をコミットに解決できなかった。`;
  }

  const resultsBranch = currentBranch(cwd);

  return resultsBranch === undefined
    ? "今のブランチが無い(detached HEAD)。コミットを指定したときは、結果を書く先に今のブランチが要る。ブランチを checkout するか、--head に手元のブランチを渡してください。"
    : { head: commit, headBranch: undefined, resultsBranch };
};

/** レビューする範囲と、結果のフォルダに使うブランチを決める。 */
export const pinRange = (
  cwd: string,
  { base, head }: Pick<ReviewArguments, "base" | "head">,
): PinnedRange | string => {
  const pinnedHead = pinHead(cwd, head);

  if (typeof pinnedHead === "string") {
    return pinnedHead;
  }

  const baseCommit = resolveCommit(cwd, base);

  if (baseCommit === undefined) {
    return `${base} が無い。`;
  }

  if (isBehindOrigin(cwd, base)) {
    return `手元の ${base} は、origin/${base} より古い。git fetch してから、--base に origin/${base} を渡してください。`;
  }

  return git(cwd, "diff", "--quiet", `${baseCommit}...${pinnedHead.head}`)
    .status === 0
    ? `${base} と ${pinnedHead.headBranch ?? pinnedHead.head} のあいだに差分が無い。`
    : { base: baseCommit, ...pinnedHead };
};
