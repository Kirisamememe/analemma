import { describe, expect, test } from "bun:test";

import { matchesRule, parseDisableDirective } from "../disable-directives";

describe("抑制のコメントの読み方", () => {
  test.each([
    {
      label: "カンマで区切ったルールと理由",
      value: " oxlint-disable-next-line a/one, two -- 理由",
      expected: {
        kind: "disable-next-line",
        reason: "理由",
        rules: ["a/one", "two"],
      },
    },
    {
      label: "空白で区切ったルール",
      value: " eslint-disable-line one two -- 理由",
      expected: { kind: "disable-line", reason: "理由", rules: ["one", "two"] },
    },
    {
      label: "ルールに続けて書いた --",
      value: " oxlint-disable one-- 理由",
      expected: { kind: "disable", reason: "理由", rules: ["one"] },
    },
    {
      label: "前後に空白のある - から始まる説明",
      value: " oxlint-disable a/one - メモ -- 理由",
      expected: { kind: "disable", reason: "", rules: ["a/one"] },
    },
    {
      label: "ルールも理由も無い抑制",
      value: " oxlint-disable-next-line",
      expected: { kind: "disable-next-line", reason: "", rules: [] },
    },
  ])("$label を、Oxlint と同じように読むこと", ({ expected, value }) => {
    expect(parseDisableDirective(value)).toEqual(expected);
  });

  test.each([" oxlint-disablefoo", " oxlint-enable one", " ふつうのコメント"])(
    "抑制でないコメント %p は読まないこと",
    (value) => {
      expect(parseDisableDirective(value)).toBeUndefined();
    },
  );
});

describe("ルールの名前の照らし合わせ", () => {
  test.each([
    { token: "project/file-length-limit", matches: true },
    { token: "file-length-limit", matches: true },
    { token: "other/file-length-limit", matches: false },
    { token: "length-limit", matches: false },
  ])(
    "$token は project/file-length-limit を指すか: $matches",
    ({ matches, token }) => {
      expect(matchesRule({ rule: "project/file-length-limit", token })).toBe(
        matches,
      );
    },
  );
});
