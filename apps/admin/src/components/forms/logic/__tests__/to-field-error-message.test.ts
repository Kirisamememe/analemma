import { describe, expect, test } from "bun:test";

import { toFieldErrorMessage } from "@/components/forms/hooks/use-field-context";

describe("フォームの誤りの知らせ", () => {
  test("文字列をつなぎ、文字列以外の値は表示に入れないこと", () => {
    expect(
      toFieldErrorMessage([
        "入力を確かめてください。",
        { path: ["title"] },
        "同じ値が使われています。",
      ]),
    ).toBe("入力を確かめてください。 同じ値が使われています。");
  });

  test("表示できる文字列が無ければ undefined になること", () => {
    expect(toFieldErrorMessage([undefined, ""])).toBeUndefined();
  });
});
