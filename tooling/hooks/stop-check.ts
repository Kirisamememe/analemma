import { spawnSync } from "node:child_process";
import { join } from "node:path";

const repoRoot = join(import.meta.dirname, "../..");
const MAX_OUTPUT_LINES = 80;

const isRetry = (input: unknown): boolean =>
  typeof input === "object" &&
  input !== null &&
  "stop_hook_active" in input &&
  input.stop_hook_active === true;

const hasChanges = (): boolean => {
  const status = spawnSync("git", ["status", "--porcelain"], {
    cwd: repoRoot,
    encoding: "utf8",
  });

  return status.status !== 0 || status.stdout.trim() !== "";
};

const tail = (text: string): string =>
  text.trimEnd().split("\n").slice(-MAX_OUTPUT_LINES).join("\n");

const rawInput = await Bun.stdin.text();
const input: unknown = rawInput.trim() === "" ? {} : JSON.parse(rawInput);

if (hasChanges()) {
  const check = spawnSync("bun", ["run", "check"], {
    cwd: repoRoot,
    encoding: "utf8",
  });

  if (check.status !== 0 && isRetry(input)) {
    process.stdout.write(
      JSON.stringify({
        systemMessage:
          "bun run check が通らないまま作業が終わりました。直すよう Claude に頼んでください。",
      }),
    );
  } else if (check.status !== 0) {
    process.stderr.write(
      `bun run check が失敗しました。直してから作業を終えてください。\n\n${tail(`${check.stdout}\n${check.stderr}`)}\n`,
    );
    process.exitCode = 2;
  }
}
