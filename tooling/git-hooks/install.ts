import { spawnSync } from "node:child_process";
import { realpathSync } from "node:fs";

const HOOKS_PATH = "tooling/git-hooks";
const packageRoot = process.cwd();

const git = (...args: string[]) =>
  spawnSync("git", args, { cwd: packageRoot, encoding: "utf8" });

const topLevel = git("rev-parse", "--show-toplevel");

if (
  topLevel.status === 0 &&
  realpathSync(topLevel.stdout.trim()) === realpathSync(packageRoot)
) {
  const current = git("config", "--get", "core.hooksPath").stdout.trim();

  if (current !== HOOKS_PATH) {
    const set = git("config", "core.hooksPath", HOOKS_PATH);

    if (set.status === 0) {
      process.stdout.write(
        `git の core.hooksPath を ${HOOKS_PATH} にしました${current === "" ? "" : `(前は ${current})`}。\n`,
      );
    } else {
      process.stderr.write(
        `git の core.hooksPath を設定できませんでした。\n${set.stderr}`,
      );
      process.exitCode = 1;
    }
  }
}
