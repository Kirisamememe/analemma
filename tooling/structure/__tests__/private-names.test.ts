import { describe, expect, test } from "bun:test";

import { findPrivateNames, readPrivateNames } from "../private-names";

const find = (text: string): string[] =>
  findPrivateNames({ names: ["Hidden-Repo", "隠し庫"], text }).map(
    ({ line, name }) => `${String(line)}:${name}`,
  );

describe("ほかのリポジトリの名前の一覧の読み方", () => {
  test("1行に1つの名前を、前後の空白を除いて読むこと", () => {
    expect(readPrivateNames("  hidden-repo  \r\n隠し庫\n")).toEqual([
      "hidden-repo",
      "隠し庫",
    ]);
  });

  test("空行と、# で始まる行は読まないこと", () => {
    expect(readPrivateNames("# 説明\n\nhidden-repo\n  # 説明")).toEqual([
      "hidden-repo",
    ]);
  });
});

describe("ほかのリポジトリの名前の探し方", () => {
  test("大文字と小文字を区別せずに探し、行の番号を返すこと", () => {
    expect(find("一行目\nHIDDEN-repo の設計\nhidden-repo")).toEqual([
      "2:Hidden-Repo",
      "3:Hidden-Repo",
    ]);
  });

  test("英字の名前は、前後が英数字と続いているときは数えないこと", () => {
    expect(find("xhidden-repo hidden-repo2 hidden-repos")).toEqual([]);
  });

  test("英字の名前は、記号や日本語と続いていても数えること", () => {
    expect(find("path/hidden-repo.ts と「hidden-repo」の")).toEqual([
      "1:Hidden-Repo",
      "1:Hidden-Repo",
    ]);
  });

  test("日本語の名前は、ほかの語と続いていても数えること", () => {
    expect(find("旧隠し庫では")).toEqual(["1:隠し庫"]);
  });

  test("名前が無いときは、何も探さないこと", () => {
    expect(findPrivateNames({ names: [], text: "hidden-repo" })).toEqual([]);
  });
});
