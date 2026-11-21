import { describe, expect, test } from "bun:test";

import { fromBase64Url, toBase64Url } from "../base64url";

describe("base64url", () => {
  test("base64url の文字列をバイト列に戻す", () => {
    expect([...fromBase64Url("-_8")]).toEqual([0xfb, 0xff]);
  });

  test("バイト列を、padding の無い base64url にする", () => {
    expect(toBase64Url(new Uint8Array([0xfb, 0xff]).buffer)).toBe("-_8");
  });

  test("戻したバイト列を、同じ文字列にできる", () => {
    const value = "AAECAwQFBgc";

    expect(toBase64Url(fromBase64Url(value).buffer)).toBe(value);
  });
});
