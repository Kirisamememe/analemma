import { describe, expect, test } from "bun:test";

import { checkSourceFile } from "../source-file";

const EXCEPTION =
  "// oxlint-disable project/max-code-lines -- 表で、分けると追えない";

const DIVIDER = [
  "// ----------------------------------------",
  "// 値",
  "// ----------------------------------------",
].join("\n");

const codeLines = (count: number): string =>
  Array.from(
    { length: count },
    (_, index) => `export const v${String(index)} = ${String(index)};`,
  ).join("\n");

const check = (lines: readonly string[]): string[] =>
  checkSourceFile({ path: "sample.ts", text: `${lines.join("\n")}\n` });

describe("ファイルの長さ", () => {
  test("コードが400行までなら、理由付きの抑制も見出しも要らないこと", () => {
    expect(check([codeLines(400)])).toEqual([]);
  });

  test("コードが401〜800行なら、1行目の理由付きの抑制と、コードが続く見出しで許すこと", () => {
    expect(check([EXCEPTION, DIVIDER, codeLines(800)])).toEqual([]);
  });

  test("コードが400行を超えるのに、1行目に理由付きの抑制が無ければ診断を出すこと", () => {
    expect(check([DIVIDER, codeLines(401)])).toEqual([
      "コードが 400 行を超えるのに、1行目に理由付きの抑制が無い",
    ]);
  });

  test("理由付きの抑制を1行目より後に書いても、400行を超えることを許さないこと", () => {
    const problems = check([DIVIDER, EXCEPTION, codeLines(401)]);

    expect(problems).toContain(
      "コードが 400 行を超えるのに、1行目に理由付きの抑制が無い",
    );
    expect(problems).toContain(
      "project/max-code-lines の抑制は、1行目に `// oxlint-disable` の形で書く",
    );
  });

  test("理由付きの抑制をブロックコメントで書いても、400行を超えることを許さないこと", () => {
    const problems = check([
      "/* oxlint-disable project/max-code-lines -- 理由 */",
      DIVIDER,
      codeLines(401),
    ]);

    expect(problems).toContain(
      "コードが 400 行を超えるのに、1行目に理由付きの抑制が無い",
    );
  });

  test.each([
    {
      label: "末尾にしか無い見出し",
      lines: [EXCEPTION, codeLines(401), DIVIDER],
    },
    {
      label: "後ろにコメントしか無い見出し",
      lines: [EXCEPTION, codeLines(401), DIVIDER, "// @ts-check"],
    },
  ])("$label は、見出しとして数えないこと", ({ lines }) => {
    expect(check(lines)).toEqual([
      "コードが 400 行を超えるのに、後ろにコードが続く分割の見出しが無い",
    ]);
  });

  test("コードが800行を超えたら、どんな抑制があっても診断を出すこと", () => {
    const problems = check([
      EXCEPTION,
      "// oxlint-disable project/file-length-limit, project/require-disable-reason -- 理由",
      DIVIDER,
      codeLines(801),
    ]);

    expect(problems).toContain("コードが 801 行あり、800 行を超えている");
    expect(problems).toContain(
      "抑制できない project/file-length-limit を抑制している",
    );
    expect(problems).toContain(
      "抑制できない project/require-disable-reason を抑制している",
    );
  });

  test("空行とコメントだけの行は数えないこと", () => {
    const padding = ["", "// 行のコメント", "/*", "  ブロックの中", "*/"];

    expect(check([codeLines(400), ...padding])).toEqual([]);
    expect(check([codeLines(401), ...padding])).toContain(
      "コードが 400 行を超えるのに、1行目に理由付きの抑制が無い",
    );
  });

  test("絵文字を含むコメントの後でも、コメントだけの行を数えないこと", () => {
    expect(
      check(["export const a = 1; // 😀", "// 行のコメント", codeLines(399)]),
    ).toEqual([]);
  });

  test("絵文字を含むコメントの後でも、後ろにコードが続く見出しを数えること", () => {
    expect(
      check([
        EXCEPTION,
        "export const a = 1; // 😀😀😀😀😀😀😀😀",
        codeLines(400),
        DIVIDER,
        "f();",
      ]),
    ).toEqual([]);
  });

  test("BOM で始まるファイルでも、1行目の理由付きの抑制で許すこと", () => {
    expect(
      checkSourceFile({
        path: "sample.ts",
        text: `\uFEFF${[EXCEPTION, DIVIDER, codeLines(401)].join("\n")}\n`,
      }),
    ).toEqual([]);
  });
});

describe("lint の抑制", () => {
  test.each([
    {
      label: "理由の無い抑制",
      line: "// oxlint-disable-next-line typescript/no-explicit-any",
      problem: "`--` の後の理由の無い抑制がある",
    },
    {
      label: "ルールの名前の無い抑制",
      line: "// oxlint-disable-next-line -- 理由",
      problem: "ルールの名前の無い抑制がある",
    },
    {
      label: "プラグイン名を省いた、抑制できないルールの抑制",
      line: "// oxlint-disable-next-line no-standalone-comment -- 理由",
      problem: "抑制できない project/no-standalone-comment を抑制している",
    },
    {
      label: "単一の - の後ろに理由を隠した抑制",
      line: "// oxlint-disable file-length-limit - メモ -- 理由",
      problem: "抑制できない project/file-length-limit を抑制している",
    },
  ])("$label に診断を出すこと", ({ line, problem }) => {
    expect(check([line, "export const value = 1;"])).toContain(problem);
  });
});
