import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { COLOR_USAGE, TEXT_PAIRS } from "../config/admin-classes";
import { lintFixture, ruleIdsOf } from "../fixture-lint";

const RESTRICTED = "better-tailwindcss(no-restricted-classes)";
const BOUNDARY = "project(styling-boundary)";

/** 診断の文言に含まれる語と、その件数。 */
type Expected = [phrase: string, count: number];

const messagesOf = (file: string, rule: string): string[] =>
  lintFixture(file)
    .diagnostics.filter((diagnostic) => diagnostic.code === rule)
    .map((diagnostic) => diagnostic.message);

const tally = (
  messages: readonly string[],
  expected: readonly Expected[],
): Expected[] =>
  expected.map(([phrase]) => [
    phrase,
    messages.filter((message) => message.startsWith(phrase)).length,
  ]);

describe("管理画面の部品の class", () => {
  const file = "invalid/apps/admin/src/ui/restricted-classes.tsx";

  test("決まりに合わない class に、決まりごとの文言で1件ずつ診断を出すこと", () => {
    const expected: Expected[] = [
      ["任意の値", 1],
      ["CSS 変数を直接読める", 1],
      ["dark: は使いません", 1],
      ["! で優先させません", 1],
      ["状態は theme.css の is-*:", 1],
      ["重ね順は", 1],
      ["outline-none の代わりに", 1],
      ["余白は", 1],
      ["縦の間は", 1],
      ["子の間は", 1],
      ["行間は", 1],
      ["文字の大きさは、行間と組", 1],
      ["文字の大きさと太さは", 2],
      ["theme.css に無い値", 2],
      ["色の不透明度は", 1],
      ["surface は bg", 1],
      ["focus は class にせず", 1],
    ];
    const messages = messagesOf(file, RESTRICTED);

    expect(tally(messages, expected)).toEqual(expected);
    expect(messages).toHaveLength(
      expected.reduce((sum, [, count]) => sum + count, 0),
    );
  });

  test("theme.css に無い class に診断を出すこと", () => {
    expect(ruleIdsOf(lintFixture(file))).toContain(
      "better-tailwindcss(no-unknown-classes)",
    );
  });

  test("文字の役割の対応では、決めていない大きさと行間の組に診断を出すこと", () => {
    const expected: Expected[] = [["文字の大きさと行間の組は", 2]];

    expect(
      tally(
        messagesOf("invalid/apps/admin/src/ui/typography.ts", RESTRICTED),
        expected,
      ),
    ).toEqual(expected);
  });

  test("style に、CSS 変数でないキーや、その場に書いていないオブジェクトを渡すと診断を出すこと", () => {
    const expected: Expected[] = [
      ["style に書けるのは", 1],
      ["style には、その場に", 1],
    ];

    expect(
      tally(
        messagesOf("invalid/apps/admin/src/ui/styled.tsx", BOUNDARY),
        expected,
      ),
    ).toEqual(expected);
  });
});

describe("管理画面の画面のコードの class", () => {
  const file = "invalid/apps/admin/src/routes/styled-screen.tsx";

  test("決めた class の外に、class ごとに診断を出すこと", () => {
    expect(messagesOf(file, RESTRICTED)).toHaveLength(2);
  });

  test("式の className と、style に診断を出すこと", () => {
    const expected: Expected[] = [
      ["画面のコードの className", 1],
      ["style は ui/ の部品", 1],
    ];

    expect(tally(messagesOf(file, BOUNDARY), expected)).toEqual(expected);
  });
});

describe("検査の設定と theme.css", () => {
  const theme = readFileSync(
    join(import.meta.dirname, "../../../apps/admin/src/ui/theme.css"),
    "utf8",
  );
  const namesOf = (prefix: string): string[] =>
    [
      ...theme.matchAll(new RegExp(`--${prefix}-(?<name>[a-z0-9\\-]+):`, "gv")),
    ].map(({ groups }) => groups?.["name"] ?? "");

  test("theme.css の色に、どれも使ってよい utility を決めてある", () => {
    expect(Object.keys(COLOR_USAGE).toSorted()).toEqual(
      [...new Set(namesOf("color"))].toSorted(),
    );
  });

  test("文字の役割の組は、theme.css の目盛りの名前で書く", () => {
    const scale = new Set(namesOf("text"));

    expect(
      TEXT_PAIRS.flatMap((pair) => pair.split("/")).filter(
        (name) => !scale.has(name),
      ),
    ).toEqual([]);
  });
});
