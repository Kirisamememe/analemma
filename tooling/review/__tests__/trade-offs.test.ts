import { describe, expect, test } from "bun:test";

import { extractTradeOffs } from "../trade-offs";

describe("「割り切ったこと」の節を取り出すこと", () => {
  test("見出しの次の行から、次の節の見出しの前までを取り出すこと", () => {
    expect(
      extractTradeOffs(
        [
          "# 決めたことと理由",
          "",
          "## 割り切ったこと",
          "",
          "- **一つめ**:受け入れる。",
          "- **二つめ**:受け入れる。",
          "",
          "## 後から足した節",
          "",
          "- 取り出さない。",
        ].join("\n"),
      ),
    ).toBe("- **一つめ**:受け入れる。\n- **二つめ**:受け入れる。");
  });

  test("ファイルの末尾にある節を、最後まで取り出すこと", () => {
    expect(
      extractTradeOffs(
        "## 前の節\n\n本文\n\n## 割り切ったこと\n\nまだ無い。\n",
      ),
    ).toBe("まだ無い。");
  });

  test("節の中の小見出しは、節の中身として残すこと", () => {
    expect(
      extractTradeOffs("## 割り切ったこと\n\n### 起動\n\n- 受け入れる。\n"),
    ).toBe("### 起動\n\n- 受け入れる。");
  });

  test("コードのブロックの中の見出しの形の行で、節を区切らないこと", () => {
    expect(
      extractTradeOffs(
        [
          "## 割り切ったこと",
          "",
          "```markdown",
          "## 例の見出し",
          "```",
          "",
          "- 受け入れる。",
          "",
          "## 次の節",
        ].join("\n"),
      ),
    ).toBe("```markdown\n## 例の見出し\n```\n\n- 受け入れる。");
  });

  test("コードのブロックの中の「割り切ったこと」の見出しから、節を始めないこと", () => {
    expect(
      extractTradeOffs("```markdown\n## 割り切ったこと\n```\n"),
    ).toBeUndefined();
  });

  test("節が無ければ undefined、中身が空なら空の文字列を返すこと", () => {
    expect(extractTradeOffs("# 決めたことと理由\n\n## 技術\n")).toBeUndefined();
    expect(extractTradeOffs("## 割り切ったこと\n\n")).toBe("");
  });

  test("CRLF の改行でも、同じように取り出すこと", () => {
    expect(
      extractTradeOffs("## 割り切ったこと\r\n\r\n- 受け入れる。\r\n## 次\r\n"),
    ).toBe("- 受け入れる。");
  });
});
