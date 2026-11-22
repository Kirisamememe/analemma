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
  head: "claude/pages",
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
  test("観点の名前と、比べるブランチを書くこと", () => {
    const prompt = buildPrompt(MATERIAL);

    expect(prompt).toStartWith(
      `# レビューの依頼:「${perspective.label}」の観点\n`,
    );
    expect(prompt).toContain(
      "ブランチ `claude/pages` の変更を、`phase/1` と比べて",
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
