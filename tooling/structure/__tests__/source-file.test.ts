import { describe, expect, test } from "bun:test";

import { checkSourceFile } from "../source-file";

const DIVIDER = [
  "// ----------------------------------------",
  "// 値",
  "// ----------------------------------------",
].join("\n");

const LONG = "long.ts";
const longFiles = new Set([LONG]);

const codeLines = (count: number): string =>
  Array.from(
    { length: count },
    (_, index) => `export const v${String(index)} = ${String(index)};`,
  ).join("\n");

const check = (lines: readonly string[], path = "sample.ts"): string[] =>
  checkSourceFile({ path, text: `${lines.join("\n")}\n` }, longFiles);

describe("ファイルの長さ", () => {
  test("コードが400行までなら、ルールを外すファイルの一覧にも見出しも要らないこと", () => {
    expect(check([codeLines(400)])).toEqual([]);
  });

  test("コードが401〜800行なら、ルールを外すファイルの一覧にあって、コードが続く見出しがあれば許すこと", () => {
    expect(check([DIVIDER, codeLines(800)], LONG)).toEqual([]);
  });

  test("コードが400行を超えるのに、ルールを外すファイルの一覧に無ければ診断を出すこと", () => {
    expect(check([DIVIDER, codeLines(401)])).toEqual([
      "コードが 400 行を超えるのに、ルールを外すファイルの一覧に無い",
    ]);
  });

  test.each([
    {
      label: "末尾にしか無い見出し",
      lines: [codeLines(401), DIVIDER],
    },
    {
      label: "後ろにコメントしか無い見出し",
      lines: [codeLines(401), DIVIDER, "// @ts-check"],
    },
  ])("$label は、見出しとして数えないこと", ({ lines }) => {
    expect(check(lines, LONG)).toEqual([
      "コードが 400 行を超えるのに、後ろにコードが続く分割の見出しが無い",
    ]);
  });

  test("コードが800行を超えたら、ルールを外すファイルの一覧にあっても診断を出すこと", () => {
    expect(check([DIVIDER, codeLines(801)], LONG)).toEqual([
      "コードが 801 行あり、800 行を超えている",
    ]);
  });

  test("空行とコメントだけの行は数えないこと", () => {
    const padding = ["", "// 行のコメント", "/*", "  ブロックの中", "*/"];

    expect(check([codeLines(400), ...padding])).toEqual([]);
    expect(check([codeLines(401), ...padding])).toContain(
      "コードが 400 行を超えるのに、ルールを外すファイルの一覧に無い",
    );
  });

  test("絵文字を含むコメントの後でも、コメントだけの行を数えないこと", () => {
    expect(
      check(["export const a = 1; // 😀", "// 行のコメント", codeLines(399)]),
    ).toEqual([]);
  });

  test("絵文字を含むコメントの後でも、後ろにコードが続く見出しを数えること", () => {
    expect(
      check(
        [
          "export const a = 1; // 😀😀😀😀😀😀😀😀",
          codeLines(400),
          DIVIDER,
          "f();",
        ],
        LONG,
      ),
    ).toEqual([]);
  });

  test("BOM で始まるファイルでも、コードの行を同じように数えること", () => {
    expect(
      checkSourceFile(
        {
          path: LONG,
          text: `\uFEFF${[DIVIDER, codeLines(401)].join("\n")}\n`,
        },
        longFiles,
      ),
    ).toEqual([]);
  });
});

describe("lint の抑制", () => {
  test.each([
    "// oxlint-disable-next-line typescript/no-explicit-any -- 理由",
    "// oxlint-disable project/max-code-lines -- 理由",
    "/* eslint-disable no-console */",
  ])("理由があっても、抑制のコメント(%s)に診断を出すこと", (line) => {
    expect(check([line, "export const value = 1;"])).toEqual([
      "lint を抑制するコメントがある",
    ]);
  });

  test("ルールを外すファイルの一覧にあるファイルでも、抑制のコメントに診断を出すこと", () => {
    expect(
      check(
        ["// oxlint-disable project/max-code-lines -- 理由", codeLines(1)],
        LONG,
      ),
    ).toEqual(["lint を抑制するコメントがある"]);
  });
});
