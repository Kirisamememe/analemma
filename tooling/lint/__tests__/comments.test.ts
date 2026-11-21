import { describe, expect, test } from "bun:test";

import { lintFixture, ruleIdsOf } from "../fixture-lint";

const commentMessages = (file: string): string[] =>
  lintFixture(`invalid/${file}`)
    .diagnostics.filter(
      (diagnostic) => diagnostic.code === "project(no-standalone-comment)",
    )
    .map((diagnostic) => diagnostic.message);

describe("コメント", () => {
  test.each([
    {
      label: "単独の行のコメント",
      file: "comments/standalone-comment.ts",
      message: "単独の行のコメントは書かないでください",
    },
    {
      label: "ブロックコメント",
      file: "comments/block-comment.ts",
      message: "ブロックコメント(/* */)は書かないでください",
    },
    {
      label: "長すぎる行末のコメント",
      file: "comments/long-trailing-comment.ts",
      message: "行末のコメントは 40 文字までです",
    },
    {
      label: "宣言の直前に無い TSDoc",
      file: "comments/misplaced-tsdoc.ts",
      message: "TSDoc は、宣言・型の項目",
    },
    {
      label: "宣言との間に分割の見出しを挟んだ TSDoc",
      file: "comments/tsdoc-before-divider.ts",
      message: "TSDoc は、宣言・型の項目",
    },
  ])("$label に診断を1件だけ出すこと", ({ file, message }) => {
    const messages = commentMessages(file);

    expect(messages).toHaveLength(1);
    expect(messages[0]).toContain(message);
  });
});

test("FIXME と XXX のコメントに、1件ずつ診断を出すこと", () => {
  expect(
    ruleIdsOf(lintFixture("invalid/comments/warning-comments.ts")).filter(
      (rule) => rule === "eslint(no-warning-comments)",
    ),
  ).toHaveLength(2);
});

describe("分割の見出し", () => {
  test("コードがちょうど200行のファイルでは、見出しごとに診断を出すこと", () => {
    const messages = commentMessages("comments/divider-in-short-file.ts");

    expect(messages).toHaveLength(2);
    expect(
      messages.every((message) =>
        message.includes("コードが 200 行を超えるファイルでだけ使えます"),
      ),
    ).toBe(true);
  });

  test.each([
    {
      label: "見出しの無い400行超のファイル",
      file: "comments/missing-divider.ts",
    },
    {
      label: "末尾にしか見出しの無い400行超のファイル",
      file: "comments/divider-at-end.ts",
    },
    {
      label: "見出しの後ろにコメントしか無い400行超のファイル",
      file: "comments/comment-after-divider.ts",
    },
  ])("$label には、見出しが要るという診断だけを出すこと", ({ file }) => {
    const messages = commentMessages(file);

    expect(messages).toHaveLength(1);
    expect(messages[0]).toContain("行を超えるファイルは、分割の見出し");
  });

  test("lint への指示を見出しの代わりにした400行超のファイルに診断を出すこと", () => {
    const messages = commentMessages("comments/directive-as-title.ts");

    expect(
      messages.filter((message) =>
        message.includes("行を超えるファイルは、分割の見出し"),
      ),
    ).toHaveLength(1);
  });

  test("罫線が片方だけの見出しに、単独の行のコメントの診断を出すこと", () => {
    const messages = commentMessages("comments/broken-divider.ts");

    expect(messages).toHaveLength(2);
    expect(
      messages.every((message) => message.includes("単独の行のコメント")),
    ).toBe(true);
  });
});

describe("TSDoc", () => {
  test.each([
    {
      label: "条件を書いた TSDoc",
      file: "tsdoc/behavior.ts",
      rule: "project(tsdoc-role-only)",
    },
    {
      label: "2文の TSDoc",
      file: "tsdoc/sentences.ts",
      rule: "project(tsdoc-role-only)",
    },
    {
      label: "説明が2行の TSDoc",
      file: "tsdoc/multiline.ts",
      rule: "project(tsdoc-role-only)",
    },
    {
      label: "使えないタグ",
      file: "tsdoc/tag.ts",
      rule: "project(tsdoc-role-only)",
    },
    {
      label: "条件を書いた @returns",
      file: "tsdoc/tag-behavior.ts",
      rule: "project(tsdoc-role-only)",
    },
    {
      label: "引数と名前の違う @param",
      file: "tsdoc/param-name.ts",
      rule: "jsdoc-js(check-param-names)",
    },
    {
      label: "何も返さない関数の @returns",
      file: "tsdoc/returns-void.ts",
      rule: "jsdoc-js(require-returns-check)",
    },
    {
      label: "型を書いた @param",
      file: "tsdoc/param-type.ts",
      rule: "jsdoc-js(no-types)",
    },
  ])("$label に診断を出すこと", ({ file, rule }) => {
    const result = lintFixture(`invalid/${file}`);

    expect(ruleIdsOf(result)).toContain(rule);
    expect(result.status).not.toBe(0);
  });
});
