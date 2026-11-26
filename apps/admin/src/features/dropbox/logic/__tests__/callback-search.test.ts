import { describe, expect, test } from "bun:test";

import { readCallbackSearch } from "@/features/dropbox/logic/callback-search";

describe("readCallbackSearch", () => {
  test("code と state があれば、許可されたとすること", () => {
    expect(readCallbackSearch({ code: "c", state: "s" })).toEqual({
      _tag: "Approved",
      code: "c",
      state: "s",
    });
  });

  test("利用者が許可しなかったことと、形の違う URL を見分けること", () => {
    expect(readCallbackSearch({ error: "access_denied", state: "s" })).toEqual({
      _tag: "Denied",
    });
    expect(readCallbackSearch({ code: "c" })).toEqual({ _tag: "Invalid" });
    expect(readCallbackSearch({ code: 1, state: "s" })).toEqual({
      _tag: "Invalid",
    });
    expect(readCallbackSearch({ code: "c".repeat(1001), state: "s" })).toEqual({
      _tag: "Invalid",
    });
  });
});
