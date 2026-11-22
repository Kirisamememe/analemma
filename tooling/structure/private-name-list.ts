import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";

import { readPrivateNames } from "./private-names";

const PRIVATE_NAME_LIST = [".private", "other-repositories.txt"];

/** worktree の中からでも、メインの checkout の直下を返す。 */
export const findMainCheckout = (repoRoot: string): string => {
  const commonDir = spawnSync(
    "git",
    ["rev-parse", "--path-format=absolute", "--git-common-dir"],
    { cwd: repoRoot, encoding: "utf8" },
  );

  if (commonDir.status !== 0 || commonDir.stdout.trim() === "") {
    throw new Error(
      `git rev-parse --git-common-dir が失敗した:${commonDir.stderr}`,
    );
  }

  return dirname(commonDir.stdout.trim());
};

/** メインの checkout に置いた手元だけの一覧から、ほかのリポジトリの名前を読む。 */
export const loadPrivateNames = (repoRoot: string): string[] => {
  const list = join(findMainCheckout(repoRoot), ...PRIVATE_NAME_LIST);

  return existsSync(list) ? readPrivateNames(readFileSync(list, "utf8")) : [];
};
