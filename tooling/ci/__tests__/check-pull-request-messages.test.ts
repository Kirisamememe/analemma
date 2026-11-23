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

/** 一時リポジトリに作る、ファイルを置いたコミット。 */
type Snapshot = {
  /** 一時リポジトリの直下。 */
  readonly root: string;
  /** 親のコミットの SHA。 */
  readonly parents: readonly string[];
  /** 置くファイルの名前と行数。 */
  readonly files: Readonly<Record<string, number>>;
};

const commitFiles = ({ files, parents, root }: Snapshot): string => {
  git(root, "read-tree", "--empty");

  for (const [name, lines] of Object.entries(files)) {
    writeFileSync(join(root, name), "追加\n".repeat(lines));
    git(root, "add", name);
  }

  return git(
    root,
    "commit-tree",
    git(root, "write-tree"),
    ...parents.flatMap((parent) => ["-p", parent]),
    "-m",
    "docs: 説明を足す",
  );
};

/** main が hotfix で先に進んだ一時リポジトリ。 */
type PhaseWithHotfix = {
  /** 一時リポジトリの直下。 */
  readonly root: string;
  /** フェーズのブランチの先端の SHA。 */
  readonly base: string;
  /** main の先端の SHA。 */
  readonly hotfix: string;
};

const makePhaseWithHotfix = (name: string): PhaseWithHotfix => {
  const { root, base: branchPoint } = makePullRequest(name, {
    base: [],
    pullRequest: [],
  });

  const base = commitFiles({
    root,
    parents: [branchPoint],
    files: { "phase.txt": 3 },
  });

  const hotfix = commitFiles({
    root,
    parents: [branchPoint],
    files: { "hotfix.txt": 900 },
  });

  git(root, "update-ref", "refs/remotes/origin/main", hotfix);

  return { root, base, hotfix };
};

describe("PR 作成前の追加行数", () => {
  test("main を取り込む PR では、main から取り込んだ分を数えないこと", async () => {
    const { root, base, hotfix } = makePhaseWithHotfix("size-main-sync");

    const head = commitFiles({
      root,
      parents: [base, hotfix],
      files: { "phase.txt": 3, "hotfix.txt": 900, "resolution.txt": 10 },
    });

    const result = await checkPullRequest({
      pullRequest: { root, base, commits: [head] },
      title: "chore: main を取り込む",
    });

    expect(result.stdout).toContain("main から取り込んだ分は数えません。");
    expect(result.stdout).toContain("追加 10 行");
    expect(result.status).toBe(0);
  });

  test("main が先に進んでいても、子の PR は自分で足した分だけを数えること", async () => {
    const { root, base } = makePhaseWithHotfix("size-main-ahead");

    const head = commitFiles({
      root,
      parents: [base],
      files: { "phase.txt": 3, "child.txt": 10 },
    });

    const result = await checkPullRequest({
      pullRequest: { root, base, commits: [head] },
      title: "docs: 説明を足す",
    });

    expect(result.stdout).not.toContain("main から取り込んだ分");
    expect(result.stdout).toContain("追加 10 行");
    expect(result.status).toBe(0);
  });

  test.each([
    { lines: 500, status: 0, notice: false },
    { lines: 501, status: 0, notice: true },
    { lines: 800, status: 0, notice: true },
    { lines: 801, status: 1, notice: false },
  ])(
    "追加 $lines 行なら終了コード $status を返すこと",
    async ({ lines, status, notice }) => {
      const { root, base } = makePullRequest(`size-${lines}`, {
        base: [],
        pullRequest: [],
      });

      writeFileSync(join(root, "changes.txt"), "追加\n".repeat(lines));
      git(root, "add", "changes.txt");

      const head = git(
        root,
        "commit-tree",
        git(root, "write-tree"),
        "-p",
        base,
        "-m",
        "docs: 説明を足す",
      );

      const result = await checkPullRequest({
        pullRequest: { root, base, commits: [head] },
        title: "docs: 説明を足す",
      });

      expect(result.stdout).toContain(`追加 ${lines} 行`);
      expect(result.stdout.includes("目安の500行を超えています")).toBe(notice);
      expect(result.status).toBe(status);
    },
  );
});
