import { describe, expect, test } from "bun:test";

import { buildReviewCommand, chooseCursorModel } from "../commands";

const LISTING = [
  "Available models",
  "",
  "auto - Auto (default)",
  "composer-2.5 - Composer 2.5",
  "gemini-4-neon-xhigh - Gemini 4 Neon  Extra High",
  "grok-4.7-xhigh - Grok 4.7  Extra High",
].join("\n");

const PATHS = {
  tree: "/tmp/review/tree",
  context: "/tmp/review/context",
  result: "/repo/.private/reviews/claude/x/logic-1.md",
};

describe("Cursor のモデルを選ぶこと", () => {
  test("候補のうち、一覧に載っている最初のモデルを選ぶこと", () => {
    expect(
      chooseCursorModel({
        candidates: ["grok-4.7-xhigh", "composer-2.5"],
        listing: LISTING,
      }),
    ).toBe("grok-4.7-xhigh");
  });

  test("最初の候補が一覧に無ければ、次の候補を選ぶこと", () => {
    expect(
      chooseCursorModel({
        candidates: ["grok-4.7-xhigh", "composer-2.5"],
        listing: LISTING.replace("grok-4.7-xhigh - ", "grok-4.7-high - "),
      }),
    ).toBe("composer-2.5");
  });

  test("どの候補も一覧に無ければ、選ばないこと", () => {
    expect(
      chooseCursorModel({ candidates: ["grok-4.7-xhigh"], listing: "" }),
    ).toBeUndefined();
  });

  test("モデルの名前の中の語や見出しの行を、ID と取り違えないこと", () => {
    expect(
      chooseCursorModel({
        candidates: ["Available", "Grok", "4.7"],
        listing: LISTING,
      }),
    ).toBeUndefined();
  });
});

describe("レビューのコマンドを組み立てること", () => {
  test("Codex は、読み取り専用の sandbox で、prompt を標準入力から読み、結果をファイルに書くこと", () => {
    expect(
      buildReviewCommand({
        reviewer: { runner: "codex", model: "gpt-6.2-sol", effort: "xhigh" },
        paths: PATHS,
      }),
    ).toEqual({
      command: "codex",
      args: [
        "exec",
        "-m",
        "gpt-6.2-sol",
        "-c",
        'model_reasoning_effort="xhigh"',
        "-s",
        "read-only",
        "--skip-git-repo-check",
        "-C",
        PATHS.tree,
        "-o",
        PATHS.result,
        "-",
      ],
      output: "file",
    });
  });

  test("Cursor は、読み取り専用の ask モードで、差分とコミットのメッセージのフォルダも読めるようにし、結果を標準出力に出すこと", () => {
    expect(
      buildReviewCommand({
        reviewer: { runner: "cursor", model: "grok-4.7-xhigh" },
        paths: PATHS,
      }),
    ).toEqual({
      command: "cursor-agent",
      args: [
        "-p",
        "--mode",
        "ask",
        "--trust",
        "--workspace",
        PATHS.tree,
        "--add-dir",
        PATHS.context,
        "--model",
        "grok-4.7-xhigh",
        "--output-format",
        "text",
      ],
      output: "stdout",
    });
  });

  test("Antigravity は、書き込みを承認しない既定のモードと sandbox で、コミットの中身のフォルダから流し、prompt を引数で渡して、結果を標準出力に出すこと", () => {
    expect(
      buildReviewCommand({
        reviewer: { runner: "agy", model: "gemini-4-hydrogen-high" },
        paths: PATHS,
      }),
    ).toEqual({
      command: "agy",
      args: [
        "--sandbox",
        "--add-dir",
        PATHS.context,
        "--model",
        "gemini-4-hydrogen-high",
        "--output-format",
        "text",
      ],
      output: "stdout",
      cwd: PATHS.tree,
      promptFlag: "--print=",
    });
  });
});
