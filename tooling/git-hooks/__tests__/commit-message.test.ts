import { describe, expect, test } from "bun:test";

import { readGlossary } from "../../structure/glossary";
import { findMessageProblems, stripComments } from "../commit-message";

const SCISSORS = "# ------------------------ >8 ------------------------";

const glossary = readGlossary(
  [
    "| 表記 | 代わりに書くもの | 探す範囲 | 除く範囲 |",
    "| --- | --- | --- | --- |",
    "| 旧名 | 新名 | リポジトリ全体 | — |",
    "| 古名 | 新名 | `tooling/` | — |",
  ].join("\n"),
);

const findInMessage = (text: string): string[] =>
  findMessageProblems({
    glossary,
    names: ["hidden-repo"],
    message: { path: ".git/COMMIT_EDITMSG", text },
  });

describe("git が消すコメントを除くこと", () => {
  test("コメントの行を空にし、行の番号を変えないこと", () => {
    expect(
      stripComments({
        commentChar: "#",
        raw: "feat: 件名\n# コメント\n\n本文\n",
      }),
    ).toBe("feat: 件名\n\n\n本文\n");
  });

  test("scissors の行から後を消すこと", () => {
    expect(
      stripComments({
        commentChar: "#",
        raw: `feat: 件名\n\n本文\n${SCISSORS}\ndiff --git a/a b/a\n+旧名\n`,
      }),
    ).toBe("feat: 件名\n\n本文");
  });

  test("git の core.commentChar の文字をコメントとして扱うこと", () => {
    expect(
      stripComments({
        commentChar: ";",
        raw: "feat: 件名\n; コメント\n# 本文\n",
      }),
    ).toBe("feat: 件名\n\n# 本文\n");
  });
});

describe("コミットのメッセージから書かないものを探すこと", () => {
  test("ほかのリポジトリの名前を、行の番号と一緒に返すこと", () => {
    expect(findInMessage("feat: 件名\n\nHidden-Repo から写す")).toEqual([
      ".git/COMMIT_EDITMSG:3: 「hidden-repo」",
    ]);
  });

  test("「機械で探す語」のうち、リポジトリ全体で探す表記だけを探すこと", () => {
    expect(findInMessage("feat: 件名\n\n旧名と古名")).toEqual([
      ".git/COMMIT_EDITMSG:3: 「旧名」→ 新名",
    ]);
  });

  test("バッククォートとかぎかっこの中は、「機械で探す語」を探さないこと", () => {
    expect(findInMessage("docs: 「旧名」を `旧名` から新名にする")).toEqual([]);
  });

  test("かぎかっこの中でも、ほかのリポジトリの名前は探すこと", () => {
    expect(findInMessage("docs: 「hidden-repo」を消す")).toEqual([
      ".git/COMMIT_EDITMSG:1: 「hidden-repo」",
    ]);
  });
});
