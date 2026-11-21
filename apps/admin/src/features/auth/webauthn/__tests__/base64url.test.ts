import { describe, expect, test } from "bun:test";

import { fromBase64Url, toBase64Url } from "../base64url";

describe("base64url", () => {
  test("base64url の文字列をバイト列に戻す", () => {
    expect([...fromBase64Url("-_8")]).toEqual([0xfb, 0xff]);
  });

  test("バイト列を、padding の無い base64url にする", () => {
    expect(toBase64Url(new Uint8Array([0xfb, 0xff]).buffer)).toBe("-_8");
  });

  test("どのバイトも、戻して同じバイト列にできる", () => {
    const bytes = Uint8Array.from({ length: 256 }, (_, index) => index);

    expect([...fromBase64Url(toBase64Url(bytes.buffer))]).toEqual([...bytes]);
  });

  test("Uint8Array の base64 の変換(Safari 18.2 から)と同じ結果にする", () => {
    const bytes = Uint8Array.from(
      { length: 70_000 },
      (_, index) => index % 251,
    );
    const encoded = toBase64Url(bytes.buffer);

    expect(encoded).toBe(
      bytes.toBase64({ alphabet: "base64url", omitPadding: true }),
    );
    expect([...fromBase64Url(encoded)]).toEqual([
      ...Uint8Array.fromBase64(encoded, { alphabet: "base64url" }),
    ]);
  });
});
