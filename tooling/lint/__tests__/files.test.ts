import { describe, expect, test } from "bun:test";

import { lintFixture, ruleIdsOf } from "../fixture-lint";

const messagesOf = (file: string, rule: string): string[] =>
  lintFixture(`invalid/${file}`)
    .diagnostics.filter((diagnostic) => diagnostic.code === rule)
    .map((diagnostic) => diagnostic.message);

describe("ファイルの長さ", () => {
  test("ルールを外すファイルの一覧に無い、コードが401行のファイルに診断を出すこと", () => {
    expect(ruleIdsOf(lintFixture("invalid/files/401-lines.ts"))).toEqual([
      "project(max-code-lines)",
    ]);
  });

  test("400行の上限を外してあっても、コードが801行のファイルに診断を出すこと", () => {
    expect(
      ruleIdsOf(lintFixture("invalid/files/801-lines-with-exception.ts")),
    ).toEqual(["project(file-length-limit)"]);
  });
});

describe("拡張子", () => {
  test("JSX の要素も fragment も含まない .tsx に診断を出すこと", () => {
    expect(
      messagesOf("files/without-jsx.tsx", "project(require-jsx-in-tsx)"),
    ).toEqual([
      "JSX を含まないファイルは `.ts` にします。`.tsx` にするのは、JSX の要素か fragment を書くファイルだけです。",
    ]);
  });

  test.each(["files/jsx-element.tsx", "files/jsx-fragment.tsx"])(
    "JSX を含む %s には診断を出さないこと",
    (file) => {
      expect(lintFixture(`valid/${file}`).diagnostics).toEqual([]);
    },
  );
});

describe("文の間の空行", () => {
  test("複数行の const と export const の前後に空行がない箇所だけに診断を出すこと", () => {
    const { diagnostics } = lintFixture("invalid/syntax/multiline-const.ts");

    expect(
      diagnostics
        .filter(
          ({ code }) => code === "stylistic(padding-line-between-statements)",
        )
        .map(({ line }) => line)
        .toSorted((left, right) => left - right),
    ).toEqual([3, 6, 9, 11, 14]);
  });
});

describe("lint の抑制", () => {
  test.each([
    { label: "理由を書いた抑制", file: "files/disable-with-reason.ts" },
    { label: "ルールの名前の無い抑制", file: "files/disable-all.ts" },
    {
      label: "ファイルの先頭に書いた抑制",
      file: "files/suppress-hard-limit.ts",
    },
  ])("$label に診断を出すこと", ({ file }) => {
    const messages = messagesOf(file, "project(no-lint-suppression)");

    expect(messages).toHaveLength(1);
    expect(messages[0]).toContain("lint を抑制するコメントは書けません");
  });
});
