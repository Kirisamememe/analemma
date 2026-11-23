import { describe, expect, test } from "bun:test";

import { lintFixture, ruleIdsOf } from "../fixture-lint";

const messagesOf = (file: string, rule: string): string[] =>
  lintFixture(`invalid/${file}`)
    .diagnostics.filter((diagnostic) => diagnostic.code === rule)
    .map((diagnostic) => diagnostic.message);

describe("ファイルの長さ", () => {
  test("理由付きの抑制の無い、コードが401行のファイルに診断を出すこと", () => {
    expect(ruleIdsOf(lintFixture("invalid/files/401-lines.ts"))).toEqual([
      "project(max-code-lines)",
    ]);
  });

  test("理由付きの抑制があっても、コードが801行のファイルに診断を出すこと", () => {
    expect(
      ruleIdsOf(lintFixture("invalid/files/801-lines-with-exception.ts")),
    ).toEqual(["project(file-length-limit)"]);
  });

  test("1行目でない場所に書いた理由付きの抑制に診断を出すこと", () => {
    expect(
      messagesOf(
        "files/exception-not-at-top.ts",
        "project(require-disable-reason)",
      ),
    ).toEqual([
      "project/max-code-lines の抑制は、ファイルの1行目に `// oxlint-disable project/max-code-lines -- 理由` の形で書きます。",
    ]);
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

describe("lint の抑制", () => {
  test("理由の無い抑制に診断を出すこと", () => {
    const messages = messagesOf(
      "files/disable-without-reason.ts",
      "project(require-disable-reason)",
    );

    expect(messages).toHaveLength(1);
    expect(messages[0]).toContain("`--` の後に理由を書きます");
  });

  test("ルールの名前も理由も無い抑制に、2つとも診断を出すこと", () => {
    const messages = messagesOf(
      "files/disable-all.ts",
      "project(require-disable-reason)",
    );

    expect(messages).toHaveLength(2);
    expect(messages.join("\n")).toContain("ルールの名前を書きます");
    expect(messages.join("\n")).toContain("理由を書きます");
  });

  test("800行の上限のルールの抑制に、理由があっても診断を出すこと", () => {
    const messages = messagesOf(
      "files/suppress-hard-limit.ts",
      "project(require-disable-reason)",
    );

    expect(messages).toHaveLength(1);
    expect(messages[0]).toContain("project/file-length-limit は抑制できません");
  });

  test.each([
    {
      label: "単一の - の後ろに理由を隠した、上限のルールの抑制",
      file: "files/single-dash-reason.ts",
      expected: [
        "project/file-length-limit は抑制できません",
        "`--` の後に理由を書きます",
      ],
    },
    {
      label: "コメントのルールの抑制",
      file: "files/suppress-comment-rule.ts",
      expected: ["project/no-standalone-comment は抑制できません"],
    },
  ])("$label に診断を出すこと", ({ expected, file }) => {
    const messages = messagesOf(file, "project(require-disable-reason)").join(
      "\n",
    );

    for (const fragment of expected) {
      expect(messages).toContain(fragment);
    }
  });
});
