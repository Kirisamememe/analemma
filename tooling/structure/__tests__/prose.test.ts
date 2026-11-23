import { describe, expect, test } from "bun:test";

import { extractProse, hasProse } from "../prose";

describe("Markdown", () => {
  test("コードのブロックの中だけを空白にし、行の数を変えないこと", () => {
    const text = [
      "本文",
      "```ts",
      "const 中身 = 1;",
      "```foo",
      "const 中身 = 2;",
      "```",
      "- 後ろ",
      "  ```",
      "  字下げした中身",
      "  ```",
      "最後",
      "~~~",
      "閉じない中身",
    ].join("\n");

    const { prose } = extractProse({ path: "a.md", text });
    const [document] = prose;

    expect(prose).toHaveLength(1);
    expect(document?.line).toBe(1);
    expect(document?.text.split("\n")).toHaveLength(13);
    expect(document?.text).toContain("本文");
    expect(document?.text).toContain("後ろ");
    expect(document?.text).toContain("最後");
    expect(document?.text).not.toContain("中身");
  });
});

describe("ソース", () => {
  test("コメントと、文字列とテンプレートリテラルの本文を、それぞれの行と一緒に取り出すこと", () => {
    const text = [
      'const 名前 = "文字列";',
      `const 型 = \`一\${名前}二\`; // 行末`,
      "/** 説明。 */",
      "export const 値 = 型;",
    ].join("\n");

    const { errors, prose } = extractProse({ path: "a.ts", text });

    expect(errors).toEqual([]);
    expect(prose).toHaveLength(5);
    expect(prose).toContainEqual({ text: "文字列", line: 1 });
    expect(prose).toContainEqual({ text: "一", line: 2 });
    expect(prose).toContainEqual({ text: "二", line: 2 });
    expect(prose).toContainEqual({ text: " 行末", line: 2 });
    expect(prose).toContainEqual({ text: "* 説明。 ", line: 3 });
  });

  test("JSX の本文を取り出すこと", () => {
    const text = "export const p = <p>本文</p>;";

    expect(extractProse({ path: "a.tsx", text }).prose).toEqual([
      { text: "本文", line: 1 },
    ]);
  });

  test("CR だけの改行も、1行と数えること", () => {
    const text = "const a = 1;\r// 文";

    expect(extractProse({ path: "a.ts", text }).prose).toEqual([
      { text: " 文", line: 2 },
    ]);
  });

  test("構文を読めないファイルは、読めなかった理由を返すこと", () => {
    const { errors } = extractProse({ path: "a.ts", text: "const = ;" });

    expect(errors).toHaveLength(1);
    expect(errors[0]).toStartWith("構文を読めない:");
  });
});

test("JSON は、文字列だけをそれぞれの行と一緒に取り出すこと", () => {
  const text = '{"鍵": "文",\n "数": 12}';

  expect(extractProse({ path: "a.json", text }).prose).toEqual([
    { text: "鍵", line: 1 },
    { text: "文", line: 1 },
    { text: "数", line: 2 },
  ]);
});

test("文書・ソース・JSON のファイルだけを、文を取り出せるファイルとすること", () => {
  expect(
    ["a.md", "a.json", "a.ts", "a.tsx", "a.mjs", "a.toml", "bun.lock"].filter(
      (path) => hasProse(path),
    ),
  ).toEqual(["a.md", "a.json", "a.ts", "a.tsx", "a.mjs"]);
});
