import { afterAll, describe, expect, setDefaultTimeout, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const SCRIPT = join(import.meta.dirname, "../check-pull-request-messages.ts");
const temporaryRoot = mkdtempSync(join(tmpdir(), "analemma-ci-"));
const PULL_REQUEST_NUMBER = "7";

setDefaultTimeout(30_000);

afterAll(() => {
  rmSync(temporaryRoot, { recursive: true, force: true });
});

const git = (cwd: string, ...args: string[]): string =>
  spawnSync(
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
  ).stdout.trim();

/** 一時リポジトリに積むコミットのメッセージ。 */
type History = {
  /** base までに積むコミット。 */
  readonly base: readonly string[];
  /** PR に積むコミット。 */
  readonly pullRequest: readonly string[];
};

/** 一時リポジトリと、PR の base と各コミットの SHA。 */
type PullRequest = {
  /** 一時リポジトリの直下。 */
  readonly root: string;
  /** PR の base の SHA。 */
  readonly base: string;
  /** PR のコミットの SHA を、古い順に並べたもの。 */
  readonly commits: readonly string[];
};

/** 一時リポジトリに順に積む、ファイルを変えないコミット。 */
type Chain = {
  /** 一時リポジトリの直下。 */
  readonly root: string;
  /** 最初のコミットの親の SHA。 */
  readonly parent: string;
  /** 積むコミットのメッセージ。 */
  readonly messages: readonly string[];
};

const commitChain = ({ messages, parent, root }: Chain): string[] => {
  const tree = git(root, "write-tree");
  const shas: string[] = [];

  for (const message of messages) {
    shas.push(
      git(
        root,
        "commit-tree",
        tree,
        "-p",
        shas.at(-1) ?? parent,
        "-m",
        message,
      ),
    );
  }

  return shas;
};

const makePullRequest = (name: string, history: History): PullRequest => {
  const root = join(temporaryRoot, name);

  mkdirSync(join(root, ".private"), { recursive: true });
  writeFileSync(
    join(root, ".private", "other-repositories.txt"),
    "hidden-repo",
  );
  git(root, "init", "--quiet");

  const first = git(
    root,
    "commit-tree",
    git(root, "write-tree"),
    "-m",
    "chore: リポジトリを作る",
  );

  const base =
    commitChain({ root, parent: first, messages: history.base }).at(-1) ??
    first;

  return {
    root,
    base,
    commits: commitChain({ root, parent: base, messages: history.pullRequest }),
  };
};

/** PR の検査の入力。 */
type Check = {
  /** 確かめる PR。 */
  readonly pullRequest: PullRequest;
  /** PR のタイトル。 */
  readonly title: string;
};

/** スクリプトを流した結果。 */
type Outcome = {
  /** 終了コード。 */
  readonly status: number;
  /** 標準出力に書いたもの。 */
  readonly stdout: string;
  /** 標準エラーに書いたもの。 */
  readonly stderr: string;
};

const checkPullRequest = async ({
  pullRequest,
  title,
}: Check): Promise<Outcome> => {
  const { base, commits, root } = pullRequest;

  const child = Bun.spawn(
    [
      process.execPath,
      SCRIPT,
      "--base",
      base,
      "--head",
      commits.at(-1) ?? base,
      "--number",
      PULL_REQUEST_NUMBER,
    ],
    { cwd: root, stdin: new Response(title), stdout: "pipe", stderr: "pipe" },
  );

  const [stdout, stderr, status] = await Promise.all([
    new Response(child.stdout).text(),
    new Response(child.stderr).text(),
    child.exited,
  ]);

  return { status, stdout, stderr };
};

describe("PR のコミットのメッセージ", () => {
  test.concurrent("PR のコミットとタイトルが形に合えば、通すこと", async () => {
    const pullRequest = makePullRequest("passing", {
      base: [],
      pullRequest: ["feat: 件名を書く", "fix(server): 期限を直す\n\n本文"],
    });

    const result = await checkPullRequest({
      pullRequest,
      title: "feat: 件名を書く",
    });

    expect(result.status).toBe(0);
  });

  test.concurrent("base より前のコミットは確かめないこと", async () => {
    const pullRequest = makePullRequest("before-base", {
      base: ["update stuff"],
      pullRequest: ["docs: 説明を書く"],
    });

    const result = await checkPullRequest({
      pullRequest,
      title: "docs: 説明を書く",
    });

    expect(result.status).toBe(0);
  });

  test.concurrent("形の合わないコミットがあれば、その SHA を示して落とすこと", async () => {
    const pullRequest = makePullRequest("format", {
      base: [],
      pullRequest: ["docs: 説明を書く", "update stuff"],
    });

    const result = await checkPullRequest({
      pullRequest,
      title: "docs: 説明を書く",
    });

    expect(result.status).toBe(1);
    expect(result.stdout).toContain("[type-empty]");
    expect(
      pullRequest.commits.filter((sha) => result.stderr.includes(sha)),
    ).toEqual(pullRequest.commits.slice(1));
  });

  test.concurrent("コミットのメッセージからも、commit-msg の hook と同じく、ほかのリポジトリの名前を探すこと", async () => {
    const pullRequest = makePullRequest("message-name", {
      base: [],
      pullRequest: ["docs: hidden-repo から写す"],
    });

    const result = await checkPullRequest({
      pullRequest,
      title: "docs: 説明を書く",
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain(":1: 「hidden-repo」");
  });
});

describe("PR のタイトル", () => {
  const pullRequest = makePullRequest("title", {
    base: [],
    pullRequest: ["docs: 説明を書く"],
  });

  test.concurrent("形の合わないタイトルなら落とすこと", async () => {
    const result = await checkPullRequest({
      pullRequest,
      title: "update stuff",
    });

    expect(result.status).toBe(1);
    expect(result.stdout).toContain("[type-empty]");
    expect(result.stderr).toContain("pull-request-title");
  });

  test.concurrent("タイトルからも、commit-msg の hook と同じく、ほかのリポジトリの名前を探すこと", async () => {
    const result = await checkPullRequest({
      pullRequest,
      title: "docs: hidden-repo から写す",
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("pull-request-title:1: 「hidden-repo」");
  });

  test.concurrent("1行目の幅を、main に残る PR の番号まで含めて数えること", async () => {
    const [fits, overflows] = await Promise.all([
      checkPullRequest({ pullRequest, title: `feat: ${"あ".repeat(44)}` }),
      checkPullRequest({ pullRequest, title: `feat: ${"あ".repeat(47)}` }),
    ]);

    expect(fits.status).toBe(0);
    expect(overflows.status).toBe(1);
    expect(overflows.stdout).toContain("[header-max-width]");
  });
});
