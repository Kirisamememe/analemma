import { describe, expect, test } from "bun:test";

import {
  type InvalidArguments,
  parseReviewArguments,
  type ReviewArguments,
} from "../arguments";

const problemOf = (parsed: ReviewArguments | InvalidArguments): string =>
  parsed._tag === "Invalid" ? parsed.problem : "引数を読めてしまった";

describe("bun run review の引数を読むこと", () => {
  test("観点と、比べる元のブランチと、レビューするブランチを読むこと", () => {
    const parsed = parseReviewArguments([
      "--perspective",
      "ui",
      "--base",
      "phase/1",
      "--head",
      "claude/admin-foundation",
    ]);

    expect(parsed).toMatchObject({
      _tag: "Parsed",
      perspective: { id: "ui" },
      base: "phase/1",
      head: "claude/admin-foundation",
    });
  });

  test("レビューするブランチを省くと、head を undefined にすること", () => {
    expect(
      parseReviewArguments(["--perspective", "logic", "--base", "phase/1"]),
    ).toMatchObject({ _tag: "Parsed", head: undefined });
  });

  test("--head に空の文字列を渡すと、省いたものとして読むこと", () => {
    expect(
      parseReviewArguments([
        "--perspective",
        "logic",
        "--base",
        "phase/1",
        "--head=",
      ]),
    ).toMatchObject({ _tag: "Parsed", head: undefined });
  });

  test("知らない観点は、選べる観点を挙げて断ること", () => {
    const parsed = parseReviewArguments([
      "--perspective",
      "performance",
      "--base",
      "phase/1",
    ]);

    expect(problemOf(parsed)).toContain(
      "logic・security・ui・conventions・wording・coherence",
    );
  });

  test("観点を省くと断ること", () => {
    expect(parseReviewArguments(["--base", "phase/1"])._tag).toBe("Invalid");
  });

  test("比べる元のブランチを省くか、空にすると断ること", () => {
    expect(problemOf(parseReviewArguments(["--perspective", "ui"]))).toContain(
      "--base",
    );
    expect(
      parseReviewArguments(["--perspective", "ui", "--base", ""])._tag,
    ).toBe("Invalid");
  });

  test("知らない option と、option でない引数を断ること", () => {
    expect(
      parseReviewArguments([
        "--perspective",
        "ui",
        "--base",
        "phase/1",
        "--model",
        "composer-2.5",
      ])._tag,
    ).toBe("Invalid");
    expect(
      parseReviewArguments(["--perspective", "ui", "--base", "phase/1", "x"])
        ._tag,
    ).toBe("Invalid");
  });
});
