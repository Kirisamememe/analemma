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
    previous: [],
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

describe("依頼文を組み立てること", () => {
  test("観点の名前と、比べるブランチを書くこと", () => {
    const prompt = buildPrompt(MATERIAL);

    expect(prompt).toStartWith(
      `# レビューの依頼:「${perspective.label}」の観点\n`,
    );
    expect(prompt).toContain(
      "ブランチ `claude/pages` の変更を、`phase/1` と比べて",
    );
  });

  test("変更後のファイル・差分・コミットのメッセージの場所を書くこと", () => {
    const prompt = buildPrompt(MATERIAL);

    expect(prompt).toContain("変更後のファイル:`/tmp/review/tree`");
    expect(prompt).toContain(
      "差分:`/tmp/review/context/diff.patch`(`git diff phase/1...claude/pages`)",
    );
    expect(prompt).toContain(
      "コミットのメッセージ:`/tmp/review/context/commits.txt`",
    );
  });

  test("各 DECISIONS.md の割り切ったことを、パスの見出しの下に並べること", () => {
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

  test("観点ごとの範囲、割り切ったこと、共通の約束の順に並べ、出力の形で終えること", () => {
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

  test("前の回の結果が無ければ、前の回に触れないこと", () => {
    expect(buildPrompt(MATERIAL)).not.toContain("前の回");
  });

  test("前の回の結果があれば、その場所と、直ったかを確かめることを書くこと", () => {
    const prompt = buildPrompt({
      ...MATERIAL,
      paths: {
        ...MATERIAL.paths,
        previous: ["/tmp/review/context/previous/logic-1.md"],
      },
    });

    expect(prompt).toContain(
      "前の回の結果:`/tmp/review/context/previous/logic-1.md`。前の回の指摘が直ったかも確かめる。",
    );
  });
});
