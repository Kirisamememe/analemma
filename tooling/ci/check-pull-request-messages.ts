import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parseArgs } from "node:util";

const COMMIT_MSG = join(import.meta.dirname, "../git-hooks/commit-msg.ts");
const TITLE_FILE = "pull-request-title";

/** commit-msg の hook のスクリプトに渡すメッセージ。 */
type Message = {
  /** メッセージを書くファイルの名前。 */
  readonly name: string;
  /** メッセージの中身。 */
  readonly text: string;
};

const git = (...args: string[]): string => {
  const result = spawnSync("git", args, { encoding: "utf8" });

  if (result.status !== 0) {
    throw new Error(`git ${args.join(" ")} が失敗した:${result.stderr}`);
  }

  return result.stdout;
};

const readCommits = (range: string): Message[] =>
  git("rev-list", "--reverse", range)
    .split("\n")
    .filter((sha) => sha !== "")
    .map((sha) => ({ name: sha, text: git("log", "-1", "--format=%B", sha) }));

const { values } = parseArgs({
  options: {
    base: { type: "string" },
    head: { type: "string" },
    number: { type: "string" },
  },
});
const { base, head, number } = values;

if (base === undefined || head === undefined || number === undefined) {
  process.stderr.write(
    "--base と --head に PR の base と head の SHA を、--number に PR の番号を渡し、PR のタイトルを標準入力に渡してください。\n",
  );
  process.exitCode = 2;
} else {
  const title = (await Bun.stdin.text()).trimEnd();
  const messages = [
    ...readCommits(`${base}..${head}`),
    { name: TITLE_FILE, text: `${title} (#${number})\n` },
  ];
  const directory = mkdtempSync(join(tmpdir(), "analemma-messages-"));

  try {
    const failed = messages
      .map(({ name, text }) => {
        const file = join(directory, name);

        writeFileSync(file, text);

        return {
          name,
          status: spawnSync(process.execPath, [COMMIT_MSG, file], {
            stdio: "inherit",
          }).status,
        };
      })
      .filter(({ status }) => status !== 0)
      .map(({ name }) => name);

    if (failed.length > 0) {
      process.stderr.write(
        `通らなかったメッセージ(コミットは SHA で、PR のタイトルは ${TITLE_FILE} で示す):\n${failed.join("\n")}\n`,
      );
      process.exitCode = 1;
    } else {
      process.stdout.write(
        `PR のコミット ${String(messages.length - 1)} 件のメッセージと、PR のタイトルが通りました。\n`,
      );
    }
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}
