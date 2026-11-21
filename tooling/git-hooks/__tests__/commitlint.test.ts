import { beforeAll, describe, expect, test } from "bun:test";
import { join } from "node:path";

/** commitlint に1つのメッセージを渡した結果。 */
type LintResult = {
  /** commitlint の終了コード。 */
  readonly status: number;
  /** 通らなかったルールの名前。 */
  readonly rules: readonly string[];
};

const repoRoot = join(import.meta.dirname, "../../..");
const COMMITLINT = join(repoRoot, "node_modules/@commitlint/cli/cli.js");
const FAILED_RULE = /^[✖⚠] .* \[(?<rule>[a-z\-]+)\]$/gmv;

const lintMessage = async (message: string): Promise<LintResult> => {
  const child = Bun.spawn([process.execPath, COMMITLINT, "--color", "false"], {
    cwd: repoRoot,
    stdin: new Response(message),
    stdout: "pipe",
    stderr: "pipe",
  });
  const [stdout, status] = await Promise.all([
    new Response(child.stdout).text(),
    child.exited,
  ]);

  return {
    status,
    rules: [...stdout.matchAll(FAILED_RULE)]
      .map(({ groups }) => groups?.["rule"] ?? "")
      .toSorted(),
  };
};

/** commitlint に渡す例のメッセージと、通らないはずのルール。 */
type Example = {
  /** テストの名前に使う、例の説明。 */
  readonly label: string;
  /** 例のメッセージ。 */
  readonly message: string;
  /** 通らないはずのルールの名前。 */
  readonly rules: readonly string[];
};

const passing: readonly Example[] = [
  {
    label: "type と日本語の件名",
    message: "feat: パスキーの登録を作る",
    rules: [],
  },
  {
    label: "scope 付きの件名",
    message: "fix(server): セッションの期限を直す",
    rules: [],
  },
  {
    label: "破壊的な変更の !",
    message: "feat(contract)!: procedure の名前を変える",
    rules: [],
  },
  {
    label: "カンマで区切った2つの scope",
    message: "refactor(contract,server): 入力の形を変える",
    rules: [],
  },
  {
    label: "英語の固有名詞で始まる件名",
    message: "docs: README を直す",
    rules: [],
  },
  {
    label: "大文字の英語の語で始まる件名",
    message: "build: PostgreSQL を 18 に上げる",
    rules: [],
  },
  {
    label: "半角に換算してちょうど100文字の1行目",
    message: `feat: ${"あ".repeat(47)}`,
    rules: [],
  },
  {
    label: "折り返さない長い本文",
    message: `feat: 件名を書く\n\n${"本文".repeat(80)}`,
    rules: [],
  },
  {
    label: "BREAKING CHANGE の footer",
    message: `feat!: 件名を書く\n\n本文\n\nBREAKING CHANGE: ${"説明".repeat(60)}`,
    rules: [],
  },
  {
    label: "git revert が作るメッセージ",
    message: 'Revert "feat: 件名を書く"\n\nThis reverts commit 0123abc.',
    rules: [],
  },
  {
    label: "git merge が作るメッセージ",
    message: "Merge branch 'topic'",
    rules: [],
  },
];

const failing: readonly Example[] = [
  {
    label: "一覧に無い type",
    message: "style: 件名を書く",
    rules: ["type-enum"],
  },
  {
    label: "一覧に無い scope",
    message: "feat(db): 件名を書く",
    rules: ["scope-enum"],
  },
  {
    label: "大文字の type",
    message: "Feat: 件名を書く",
    rules: ["type-case", "type-enum"],
  },
  {
    label: "type の無い件名",
    message: "件名を書く",
    rules: ["subject-empty", "type-empty"],
  },
  {
    label: "英語だけの件名",
    message: "feat: add passkeys",
    rules: ["subject-japanese"],
  },
  {
    label: "句点で終わる件名",
    message: "feat: 件名を書く。",
    rules: ["subject-full-stop"],
  },
  {
    label: "半角に換算して100文字を超える1行目",
    message: `feat: ${"あ".repeat(48)}`,
    rules: ["header-max-width"],
  },
  {
    label: "空行を挟まない本文",
    message: "feat: 件名を書く\n本文",
    rules: ["body-leading-blank"],
  },
];

const results = new Map<string, LintResult>();

beforeAll(async () => {
  const messages = [...passing, ...failing].map(({ message }) => message);
  const linted = await Promise.all(
    messages.map(async (message) => lintMessage(message)),
  );

  for (const [index, message] of messages.entries()) {
    results.set(message, linted[index] ?? { status: -1, rules: [] });
  }
});

describe("コミットのメッセージの形", () => {
  test.each(passing)("$label を通すこと", ({ message }) => {
    expect(results.get(message)).toEqual({ status: 0, rules: [] });
  });

  test.each(failing)("$label を止めること", ({ message, rules }) => {
    expect(results.get(message)).toEqual({ status: 1, rules });
  });
});
