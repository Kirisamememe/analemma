import { describe, expect, test } from "bun:test";

import { readGlossary } from "../glossary";
import { findBannedTerms } from "../glossary-search";
import { extractProse, type Prose } from "../prose";

const glossary = readGlossary(
  [
    "| 表記 | 代わりに書くもの | 探す範囲 | 除く範囲 |",
    "| --- | --- | --- | --- |",
    "| 旧名、XYZ、曖 | 新名 | リポジトリ全体 | — |",
    "| 古名 | 新名 | `apps/one/` | `apps/one/docs/` |",
  ].join("\n"),
);

const find = (path: string, prose: readonly Prose[]): string[] =>
  findBannedTerms({ glossary, path, prose }).map(
    ({ line, term }) => `${String(line)}:${term}`,
  );

const lines = (...texts: string[]): Prose[] => [
  { text: texts.join("\n"), line: 1 },
];

describe("使わない表記の探し方", () => {
  test("取り出した文の行の番号に、文の中の行を足した番号を返すこと", () => {
    expect(
      findBannedTerms({
        glossary,
        path: "a.md",
        prose: [{ text: "一行目\n旧名", line: 10 }],
      }),
    ).toEqual([{ term: "旧名", replacement: "新名", line: 11 }]);
  });

  test("バッククォートとかぎかっこの中は探さないこと", () => {
    expect(
      find(
        "a.md",
        lines("`旧名` と ``a`旧名`` と「旧名」と「外「内」の旧名」", "旧名"),
      ),
    ).toEqual(["2:旧名"]);
  });

  test("かぎかっこを、文と行をまたいで閉じたものとして扱わないこと", () => {
    const parts = [
      { text: "「", line: 1 },
      { text: "旧名", line: 1 },
      { text: "」", line: 1 },
    ];

    expect(find("a.ts", parts)).toEqual(["1:旧名"]);
    expect(find("a.md", lines("「閉じない", "旧名"))).toEqual(["2:旧名"]);
  });

  test("日本語の表記は、ほかの語の一部になっていても数えること", () => {
    expect(find("a.md", lines("曖昧な語"))).toEqual(["1:曖"]);
  });

  test("英字の語は、英数字や、英数字に続く - . / とつながっているときは数えないこと", () => {
    expect(
      find(
        "a.md",
        lines(
          "XYZabc abc-XYZ XYZ.ts path/XYZ",
          "この XYZ は",
          "文の終わりの XYZ.",
        ),
      ),
    ).toEqual(["2:XYZ", "3:XYZ"]);
  });

  test("探す範囲のある語は、その範囲の中でだけ探すこと", () => {
    expect(find("apps/two/a.md", lines("古名"))).toEqual([]);
    expect(find("apps/one/a.md", lines("古名"))).toEqual(["1:古名"]);
  });

  test("除く範囲の中では探さないこと", () => {
    expect(find("apps/one/docs/a.md", lines("古名"))).toEqual([]);
    expect(find("apps/one/docs-old/a.md", lines("古名"))).toEqual(["1:古名"]);
  });

  test("LF・CRLF・CR・U+2028・U+2029 のどれも、1つの改行と数えること", () => {
    expect(find("a.md", lines("a\r\nb\rc\u2028d\u2029旧名"))).toEqual([
      "5:旧名",
    ]);
  });
});

test("ソースから取り出した文の中の表記を、元のファイルの行で返すこと", () => {
  const text = [
    "const a = 1;",
    `const b = \`甲\${/* 旧名 */ a}乙\`;`,
    "const c = `",
    "旧名`;",
    "// XYZ",
  ].join("\n");
  const { prose } = extractProse({ path: "a.ts", text });

  expect(find("a.ts", prose)).toEqual(["2:旧名", "4:旧名", "5:XYZ"]);
});
