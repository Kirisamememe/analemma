import { describe, expect, test } from "bun:test";

import { PERSPECTIVES } from "../perspectives";
import { buildPrompt, type PromptMaterial } from "../prompt";

const [perspective] = PERSPECTIVES;

if (perspective === undefined) {
  throw new Error("観点が1つも無い");
}

const MATERIAL: PromptMaterial = {
  perspective,
  base: "phase/1",
  headBranch: "claude/pages",
  baseCommit: "1".repeat(40),
  headCommit: "2".repeat(40),
  paths: {
    tree: "/tmp/review/tree",
    diff: "/tmp/review/context/diff.patch",
    commits: "/tmp/review/context/commits.txt",
  },
  scope:
    "## 見る範囲\n\n- 観点ごとの範囲。\n\n## 見ない範囲\n\n- ほかの観点。\n",
  rules: "## 守ること\n\n- 共通の約束。\n\n## 出力の形\n\n最後の行の約束。\n",
  tradeOffs: [
    { path: "DECISIONS.md", body: "- **直下の件**:受け入れる。" },
    {
      path: "apps/server/DECISIONS.md",
      body: "- **server の件**:受け入れる。",
    },
  ],
};

describe("prompt を組み立てること", () => {
  test("観点の名前と、比べるブランチとそのコミットの SHA を書くこと", () => {
    const prompt = buildPrompt(MATERIAL);

    expect(prompt).toStartWith(
      `# レビューの依頼:「${perspective.label}」の観点\n`,
    );
    expect(prompt).toContain(
      `ブランチ \`claude/pages\`(コミット \`${"2".repeat(40)}\`)の変更を、\`phase/1\`(コミット \`${"1".repeat(40)}\`)と比べて`,
    );
  });

  test("ブランチの中身・差分・コミットのメッセージの場所を書くこと", () => {
    const prompt = buildPrompt(MATERIAL);

    expect(prompt).toContain(
      "レビューするブランチの中身:`/tmp/review/tree`。ブランチ `claude/pages` にコミットしたすべてのファイル",
    );
    expect(prompt).toContain(
      "差分:`/tmp/review/context/diff.patch`(`git diff phase/1...claude/pages`)",
    );
    expect(prompt).toContain(
      "コミットのメッセージ:`/tmp/review/context/commits.txt`",
    );
  });

  test("コミットをレビューするときは、対象の中身と差分を SHA で示すこと", () => {
    const { baseCommit, headCommit } = MATERIAL;
    const prompt = buildPrompt({ ...MATERIAL, headBranch: undefined });

    expect(prompt).toContain(
      `コミット \`${headCommit}\` の変更を、\`phase/1\`(コミット \`${baseCommit}\`)と比べて`,
    );
    expect(prompt).toContain(
      `レビューするコミットの中身:\`/tmp/review/tree\`。コミット \`${headCommit}\` のすべてのファイル`,
    );
    expect(prompt).toContain(
      `差分:\`/tmp/review/context/diff.patch\`(\`git diff ${baseCommit}...${headCommit}\`)`,
    );
  });

  test("「直下」が、レビューするブランチの中身のフォルダの直下を指すと書くこと", () => {
    const prompt = buildPrompt(MATERIAL);

    expect(prompt).toContain("以下の「直下」は、このフォルダの直下を指す。");
    expect(prompt).toContain(
      "リポジトリの約束:このフォルダの直下の `AGENTS.md`・`DECISIONS.md`・`GLOSSARY.md`",
    );
  });

  test("各 DECISIONS.md の「割り切ったこと」を、パスの見出しの下に並べること", () => {
    expect(buildPrompt(MATERIAL)).toContain(
      [
        "## 割り切ったこと",
        "",
        "各 `DECISIONS.md` の末尾の「割り切ったこと」を集めたもの。",
        "",
        "### `DECISIONS.md`",
        "",
        "- **直下の件**:受け入れる。",
        "",
        "### `apps/server/DECISIONS.md`",
        "",
        "- **server の件**:受け入れる。",
      ].join("\n"),
    );
  });

  test("観点ごとの範囲、「割り切ったこと」、共通の約束の順に並べ、出力の形で終えること", () => {
    const prompt = buildPrompt(MATERIAL);

    const order = [
      "## 見る範囲",
      "## 見ない範囲",
      "## 割り切ったこと",
      "## 守ること",
      "## 出力の形",
    ].map((heading) => prompt.indexOf(`\n${heading}\n`));

    expect(order.every((index) => index > 0)).toBe(true);
    expect(order).toEqual(order.toSorted((left, right) => left - right));
    expect(prompt).toEndWith("最後の行の約束。\n");
  });
});

describe("2回目からの prompt を組み立てること", () => {
  const PREVIOUS = "3".repeat(40);

  const REREVIEW = {
    round: 1,
    previousHead: PREVIOUS,
    result: "/tmp/review/context/previous-result.md",
    decisions: "/tmp/review/context/previous-decisions.jsonl",
    fixes: {
      diff: "/tmp/review/context/fixes.patch",
      commits: "/tmp/review/context/fix-commits.txt",
    },
    rules: "## 前の回の指摘\n\n- 前の回の約束。\n",
  };

  test("前の回の結果・採否・前の回の後に足したコミットの場所と、前の回にレビューしたコミットを書くこと", () => {
    const prompt = buildPrompt({ ...MATERIAL, rereview: REREVIEW });

    expect(prompt).toContain(
      [
        "## 前の回",
        "",
        `これは 2 回目のレビュー。前の回(1 回目)は、コミット \`${PREVIOUS}\` をレビューした。`,
        "",
        "- 前の回の結果:`/tmp/review/context/previous-result.md`",
        "- 前の回の指摘の採否:`/tmp/review/context/previous-decisions.jsonl`",
        `- 前の回の後に足したコミットの差分:\`/tmp/review/context/fixes.patch\`(\`git diff ${PREVIOUS} ${"2".repeat(40)}\`)`,
        "- 前の回の後に足したコミットのメッセージ:`/tmp/review/context/fix-commits.txt`",
        "",
        "## 前の回の指摘",
      ].join("\n"),
    );
  });

  test("ブランチの全体を見るときは前の回の後に足したコミットを書かず、採否の記録が無ければそう書くこと", () => {
    const prompt = buildPrompt({
      ...MATERIAL,
      rereview: { ...REREVIEW, decisions: undefined, fixes: undefined },
    });

    expect(prompt).toContain(
      "- 前の回の指摘の採否:記録が無い\n\n## 前の回の指摘",
    );
    expect(prompt).not.toContain("前の回の後に足したコミット");
  });

  test("前の回の節を、観点ごとの範囲の後、「割り切ったこと」の前に置くこと", () => {
    const prompt = buildPrompt({ ...MATERIAL, rereview: REREVIEW });

    const order = ["## 見ない範囲", "## 前の回", "## 割り切ったこと"].map(
      (heading) => prompt.indexOf(`\n${heading}\n`),
    );

    expect(order.every((index) => index > 0)).toBe(true);
    expect(order).toEqual(order.toSorted((left, right) => left - right));
  });

  test("1回目には、前の回の節を書かないこと", () => {
    expect(buildPrompt(MATERIAL)).not.toContain("## 前の回");
  });
});
