import { afterAll, describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { checkFixRange, pinRange } from "../range";

const temporaryRoot = mkdtempSync(join(tmpdir(), "analemma-review-test-"));

afterAll(() => {
  rmSync(temporaryRoot, { recursive: true, force: true });
});

const git = (cwd: string, ...args: string[]): string => {
  const result = spawnSync(
    "env",
    [
      "GIT_AUTHOR_NAME=test",
      "GIT_AUTHOR_EMAIL=test@example.invalid",
      "GIT_AUTHOR_DATE=1000000000 +0000",
      "GIT_COMMITTER_NAME=test",
      "GIT_COMMITTER_EMAIL=test@example.invalid",
      "GIT_COMMITTER_DATE=1000000000 +0000",
      "git",
      "-c",
      "commit.gpgsign=false",
      "-c",
      "i18n.commitEncoding=UTF-8",
      "-c",
      "core.hooksPath=/dev/null",
      ...args,
    ],
    { cwd, encoding: "utf8" },
  );

  if (result.status !== 0) {
    throw new Error(`git ${args.join(" ")} が失敗した:${result.stderr}`);
  }

  return result.stdout.trim();
};

const commit = (cwd: string, path: string): string => {
  writeFileSync(join(cwd, path), `${path}\n`);
  git(cwd, "add", path);
  git(cwd, "commit", "--quiet", "--message", `chore: ${path}`);

  return git(cwd, "rev-parse", "HEAD");
};

const initRepository = (name: string): string => {
  const cwd = join(temporaryRoot, name);

  mkdirSync(cwd);
  git(cwd, "init", "--quiet", "--initial-branch=main", "--object-format=sha1");

  return cwd;
};

const makeRepository = (name: string) => {
  const cwd = initRepository(name);
  const base = commit(cwd, "README.md");

  git(cwd, "switch", "--quiet", "-c", "claude/pages");

  const head = commit(cwd, "pages.md");

  git(cwd, "switch", "--quiet", "-c", "claude/current", "main");

  return { cwd, base, head };
};

describe("レビューする範囲を決めること", () => {
  test("手元のブランチを渡すと、そのブランチの名前を結果のフォルダに使うこと", () => {
    const { cwd, base, head } = makeRepository("branch");

    expect(pinRange(cwd, { base: "main", head: "claude/pages" })).toEqual({
      base,
      head,
      headBranch: "claude/pages",
      resultsBranch: "claude/pages",
    });
  });

  test("head を省くと、今のブランチをレビューすること", () => {
    const { cwd, base, head } = makeRepository("default-head");

    git(cwd, "switch", "--quiet", "claude/pages");

    expect(pinRange(cwd, { base: "main", head: undefined })).toEqual({
      base,
      head,
      headBranch: "claude/pages",
      resultsBranch: "claude/pages",
    });
  });

  test("短い SHA を渡すと、今のブランチの名前を結果のフォルダに使うこと", () => {
    const { cwd, base, head } = makeRepository("commit");

    expect(pinRange(cwd, { base: "main", head: head.slice(0, 12) })).toEqual({
      base,
      head,
      headBranch: undefined,
      resultsBranch: "claude/current",
    });
  });

  test("短い SHA が blob にも一致するときは、コミットに絞って解決すること", () => {
    const { cwd, base, head } = makeRepository("ambiguous-commit");
    const shortHead = head.slice(0, 4);

    git(cwd, "config", "core.disambiguate", "none");
    writeFileSync(join(cwd, "blob.txt"), "28311\n");
    const blob = git(cwd, "hash-object", "-w", "blob.txt");

    expect(blob.slice(0, 4)).toBe(shortHead);
    expect(pinRange(cwd, { base: "main", head: shortHead })).toEqual({
      base,
      head,
      headBranch: undefined,
      resultsBranch: "claude/current",
    });
  });

  test("ブランチ名を含む revision は、コミットとして扱うこと", () => {
    const { cwd, head } = makeRepository("revision");

    git(cwd, "switch", "--quiet", "claude/pages");
    commit(cwd, "more-pages.md");
    git(cwd, "switch", "--quiet", "claude/current");

    expect(
      pinRange(cwd, { base: "main", head: "claude/pages~1" }),
    ).toMatchObject({
      head,
      headBranch: undefined,
      resultsBranch: "claude/current",
    });
  });

  test("コミットメッセージの正規表現で head を指定できること", () => {
    const { cwd, base, head } = makeRepository("message");

    expect(
      pinRange(cwd, { base: "main", head: ":/^chore: pages[.]md\n$" }),
    ).toEqual({
      base,
      head,
      headBranch: undefined,
      resultsBranch: "claude/current",
    });
  });

  test("detached HEAD でコミットを渡すと、結果を書く先が無いと伝えること", () => {
    const { cwd, head } = makeRepository("detached-commit");

    git(cwd, "switch", "--quiet", "--detach", head);

    expect(pinRange(cwd, { base: "main", head })).toBe(
      "今のブランチが無い(detached HEAD)。コミットを指定したときは、結果を書く先に今のブランチが要る。ブランチを checkout するか、--head に手元のブランチを渡してください。",
    );
  });

  test("detached HEAD で head を省くと、手元のブランチを求めること", () => {
    const { cwd, head } = makeRepository("detached-default");

    git(cwd, "switch", "--quiet", "--detach", head);

    expect(pinRange(cwd, { base: "main", head: undefined })).toBe(
      "今のブランチが無い(detached HEAD)。--head に手元のブランチを渡してください。",
    );
  });

  test("detached HEAD でも手元のブランチを渡すと、そのブランチをレビューすること", () => {
    const { cwd, head } = makeRepository("detached-branch");

    git(cwd, "switch", "--quiet", "--detach", "main");

    expect(pinRange(cwd, { base: "main", head: "claude/pages" })).toMatchObject(
      {
        head,
        resultsBranch: "claude/pages",
      },
    );
  });

  test("指定した名前のブランチもコミットも無ければ理由を返すこと", () => {
    const { cwd } = makeRepository("unknown-head");

    expect(pinRange(cwd, { base: "main", head: "missing" })).toBe(
      "手元にブランチ missing が無く、missing をコミットに解決できなかった。",
    );
  });

  test("今のブランチにまだコミットが無いときは理由を返すこと", () => {
    const cwd = initRepository("empty");

    expect(pinRange(cwd, { base: "main", head: undefined })).toBe(
      "今のブランチ main にコミットが無い。",
    );
  });

  test("同じ名前のブランチとタグがあれば、ブランチを取ること", () => {
    const { cwd, base, head } = makeRepository("ambiguous-head");

    git(cwd, "tag", "claude/pages", base);

    expect(pinRange(cwd, { base: "main", head: "claude/pages" })).toMatchObject(
      {
        head,
        headBranch: "claude/pages",
        resultsBranch: "claude/pages",
      },
    );
  });

  test("コミットを渡して差分が無ければ理由を返すこと", () => {
    const { cwd } = makeRepository("no-diff");
    const head = git(cwd, "rev-parse", "HEAD");

    expect(pinRange(cwd, { base: "main", head })).toBe(
      `main と ${head} のあいだに差分が無い。`,
    );
  });

  test("手元の base のブランチが origin の同じ名前のブランチより古ければ、origin の方を渡すよう伝えること", () => {
    const { cwd, head } = makeRepository("behind-origin");

    git(cwd, "switch", "--quiet", "-c", "claude/merged", "main");
    const merged = commit(cwd, "merged.md");

    git(cwd, "update-ref", "refs/remotes/origin/main", merged);

    expect(pinRange(cwd, { base: "main", head: "claude/pages" })).toBe(
      "手元の main は、origin/main より古い。git fetch してから、--base に origin/main を渡してください。",
    );
    expect(
      pinRange(cwd, { base: "origin/main", head: "claude/pages" }),
    ).toMatchObject({ base: merged, head });
  });

  test("手元の base のブランチが origin より新しければ、手元のまま比べること", () => {
    const { cwd, base, head } = makeRepository("ahead-of-origin");

    git(cwd, "update-ref", "refs/remotes/origin/main", base);
    git(cwd, "switch", "--quiet", "main");
    const local = commit(cwd, "local.md");

    expect(pinRange(cwd, { base: "main", head: "claude/pages" })).toMatchObject(
      { base: local, head },
    );
  });

  test("base と head のブランチが進んだ後も、先に決めた SHA の組を使えること", () => {
    const { cwd, base, head } = makeRepository("pinned");
    const pinned = pinRange(cwd, { base: "main", head: "claude/pages" });

    if (typeof pinned === "string") {
      throw new Error(pinned);
    }

    git(cwd, "branch", "--force", "main", head);
    git(cwd, "switch", "--quiet", "claude/pages");
    commit(cwd, "more-pages.md");

    expect(pinned).toMatchObject({ base, head });
    expect(
      git(cwd, "diff", "--name-only", `${pinned.base}...${pinned.head}`),
    ).toBe("pages.md");
  });
});

describe("直したコミットの範囲を確かめること", () => {
  test("前の回のコミットが今のコミットの祖先なら、直したコミットとして読むこと", () => {
    const { cwd, head } = makeRepository("fixes");

    git(cwd, "switch", "--quiet", "claude/pages");
    const fixed = commit(cwd, "fix.md");

    expect(checkFixRange(cwd, { previous: head, head: fixed })).toBeUndefined();
  });

  test("前の回からコミットが足されていなくても、空の範囲として読めること", () => {
    const { cwd, head } = makeRepository("no-fixes");

    expect(checkFixRange(cwd, { previous: head, head })).toBeUndefined();
  });

  test("rebase して前の回のコミットが祖先に無ければ、--full を求めること", () => {
    const { cwd, head } = makeRepository("rebased");

    git(cwd, "switch", "--quiet", "main");
    commit(cwd, "other-pull-request.md");
    git(cwd, "switch", "--quiet", "claude/pages");
    git(cwd, "rebase", "--quiet", "main");
    const rebased = git(cwd, "rev-parse", "HEAD");

    expect(checkFixRange(cwd, { previous: head, head: rebased })).toContain(
      "--full",
    );
  });
});
