import { describe, expect, test } from "bun:test";

import { readGlossary } from "../glossary";

const BASE = [
  "| 語 | 意味 |",
  "| --- | --- |",
  "| 新名 | 旧名と書かない。 |",
  "",
  "| 表記 | 代わりに書くもの | 探す範囲 | 除く範囲 |",
  "| --- | --- | --- | --- |",
  "| 旧名、曖を付け | 新名 | リポジトリ全体 | — |",
  "| 長旧名 | `大旧名` | `apps/one/`、`packages/two/` | `apps/one/docs/` |",
];

const read = (lines: readonly string[]) => readGlossary(lines.join("\n"));

describe("用語集の読み方", () => {
  const glossary = read(BASE);

  test("形の正しい表には、誤りを返さないこと", () => {
    expect(glossary.problems).toEqual([]);
  });

  test("「機械で探す語」の表の行だけを、探す表記にすること", () => {
    expect(glossary.banned).toEqual([
      { term: "旧名", replacement: "新名", scopes: [], excludes: [] },
      { term: "曖を付け", replacement: "新名", scopes: [], excludes: [] },
      {
        term: "長旧名",
        replacement: "`大旧名`",
        scopes: ["apps/one/", "packages/two/"],
        excludes: ["apps/one/docs/"],
      },
    ]);
  });

  test("字下げした行も、表の行として読むこと", () => {
    const indented = read(BASE.map((line) => `  ${line}`));

    expect(indented.problems).toEqual([]);
    expect(indented.banned).toEqual(glossary.banned);
  });
});

describe("用語集の表の形の誤り", () => {
  test.each([
    {
      label: "空の代わりに書くもの",
      row: "| 旧名 | — | リポジトリ全体 | — |",
      problem: "代わりに書くものが空:旧名",
    },
    {
      label: "空の探す範囲",
      row: "| 旧名 | 新名 | — | — |",
      problem: "探す範囲が空:旧名",
    },
    {
      label: "/ で終わらない探す範囲",
      row: "| 旧名 | 新名 | `apps` | — |",
      problem: "探す範囲は / で終わるフォルダにする:apps",
    },
    {
      label: "/ で終わらない除く範囲",
      row: "| 旧名 | 新名 | `apps/` | `apps/docs` |",
      problem: "除く範囲は / で終わるフォルダにする:apps/docs",
    },
    {
      label: "列の数が見出しと合わない行",
      row: "| 旧名 | 新名 |",
      problem: "列の数が見出しと合わない行:旧名 | 新名",
    },
  ])("$label を返すこと", ({ problem, row }) => {
    expect(read([...BASE, row]).problems).toEqual([problem]);
  });

  test("表の外にある行を返すこと", () => {
    expect(
      read([...BASE, "", "| 旧名 | 新名 | リポジトリ全体 | — |"]).problems,
    ).toEqual(["表の外にある行:| 旧名 | 新名 | リポジトリ全体 | — |"]);
  });

  test("区切りの行の列の数が見出しと合わない表を返すこと", () => {
    expect(read(BASE.with(1, "| --- | --- | --- |")).problems).toEqual([
      "区切りの行の列の数が見出しと合わない:| 語 | 意味 |",
    ]);
  });

  test("「機械で探す語」の表が無いことを返すこと", () => {
    expect(read(BASE.slice(0, 3)).problems).toEqual([
      "見出しが「表記|代わりに書くもの|探す範囲|除く範囲」の表が無い",
    ]);
  });
});
