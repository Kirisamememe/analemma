import { describe, expect, test } from "bun:test";

import { encodeCbor } from "../../fake-authenticator/encode-cbor";
import { decodeCbor } from "../decode-cbor";

const bytes = (...values: number[]): Uint8Array<ArrayBuffer> =>
  new Uint8Array(values);

const decode = (input: Uint8Array<ArrayBuffer>): unknown => {
  const decoded = decodeCbor(input);

  return decoded._tag === "Decoded" ? decoded.value : decoded;
};

const problemOf = (input: Uint8Array<ArrayBuffer>): string => {
  const decoded = decodeCbor(input);

  return decoded._tag === "Rejected" ? decoded.problem : "";
};

const nested = (depth: number): Uint8Array<ArrayBuffer> =>
  new Uint8Array([...Array.from({ length: depth }, () => 0x81), 0x00]);

describe("CBOR の読み取り", () => {
  test("整数を、長さの違う5通りの形と負の数で読むこと", () => {
    expect(decode(bytes(0x17))).toBe(23);
    expect(decode(bytes(0x18, 0x18))).toBe(24);
    expect(decode(bytes(0x19, 0x03, 0xe8))).toBe(1000);
    expect(decode(bytes(0x1a, 0x00, 0x0f, 0x42, 0x40))).toBe(1_000_000);
    expect(
      decode(bytes(0x1b, 0x00, 0x00, 0x00, 0xe8, 0xd4, 0xa5, 0x10, 0x00)),
    ).toBe(1_000_000_000_000);
    expect(decode(bytes(0x20))).toBe(-1);
    expect(decode(bytes(0x38, 0x63))).toBe(-100);
    expect(decode(bytes(0x39, 0x01, 0x00))).toBe(-257);
  });

  test("バイト列・文字列・配列・map・true・false・null を読むこと", () => {
    expect(decode(bytes(0x44, 0x01, 0x02, 0x03, 0x04))).toEqual(
      bytes(1, 2, 3, 4),
    );
    expect(decode(bytes(0x62, 0xc3, 0xbc))).toBe("ü");
    expect(decode(bytes(0x83, 0x01, 0x82, 0x02, 0x03, 0x04))).toEqual([
      1,
      [2, 3],
      4,
    ]);
    expect(decode(bytes(0xf4))).toBe(false);
    expect(decode(bytes(0xf5))).toBe(true);
    expect(decode(bytes(0xf6))).toBeNull();

    const map = new Map<number | string, number | string>([
      [1, 2],
      [-1, 1],
      ["fmt", "none"],
    ]);

    expect(decode(encodeCbor(map))).toEqual(map);
  });

  test("読み終えた位置を返し、後ろの余りは呼ぶ側に任せること", () => {
    const input = bytes(0x00, 0x82, 0x01, 0x02, 0xff, 0xff);

    expect(decodeCbor(input, 1)).toEqual({
      _tag: "Decoded",
      value: [1, 2],
      end: 4,
    });
  });

  test("2^53 以上の整数を拒むこと", () => {
    expect(decode(encodeCbor(Number.MAX_SAFE_INTEGER))).toBe(
      Number.MAX_SAFE_INTEGER,
    );
    expect(
      problemOf(bytes(0x1b, 0x00, 0x20, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00)),
    ).toContain("2^53");
    expect(
      problemOf(bytes(0x3b, 0x00, 0x1f, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff)),
    ).toContain("2^53");
  });

  test.each([
    [bytes(0x5f, 0x41, 0x01, 0xff), "不定長"],
    [bytes(0x9f, 0x01, 0xff), "不定長"],
    [bytes(0xbf, 0x01, 0x02, 0xff), "不定長"],
    [bytes(0xc0, 0x60), "タグ"],
    [bytes(0xf9, 0x3c, 0x00), "浮動小数"],
    [bytes(0xfb, 0x3f, 0xf0, 0, 0, 0, 0, 0, 0), "浮動小数"],
    [bytes(0xf7), "浮動小数"],
    [bytes(0x1c), "予約"],
  ])("要らない形 %p を拒むこと", (input, problem) => {
    expect(problemOf(input)).toContain(problem);
  });

  test.each([
    bytes(),
    bytes(0x19, 0x01),
    bytes(0x44, 0x01, 0x02),
    bytes(0x82, 0x01),
    bytes(0xa1, 0x01),
    bytes(0x9a, 0xff, 0xff, 0xff, 0xff),
  ])("途中で切れた入力 %p を拒むこと", (input) => {
    expect(problemOf(input)).toContain("途中で切れている");
  });

  test("深すぎる入れ子を拒むこと", () => {
    expect(decodeCbor(nested(16))._tag).toBe("Decoded");
    expect(problemOf(nested(17))).toContain("深すぎる");
  });

  test("map のキーが整数でも文字列でもないものと、重なったキーを拒むこと", () => {
    expect(problemOf(bytes(0xa1, 0x40, 0x01))).toContain("キー");
    expect(problemOf(bytes(0xa2, 0x01, 0x02, 0x01, 0x03))).toContain(
      "重なっている",
    );
  });

  test("UTF-8 として読めないバイトを、置換文字にして読むこと", () => {
    expect(decode(bytes(0x62, 0x61, 0xff))).toBe("a\uFFFD");
  });
});
