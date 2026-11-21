import { describe, expect, test } from "bun:test";

import { convertToDerSignature } from "../../fake-authenticator/convert-to-der-signature";
import { readDerSignature } from "../read-der-signature";

describe("ES256 の署名の DER から r‖s への変換", () => {
  test("上の位のビットが立つ値と、短い値を、32 バイトずつに戻すこと", () => {
    const raw = new Uint8Array(64);

    raw.fill(0xff, 0, 32);
    raw.fill(0x01, 34, 64);

    const der = convertToDerSignature(raw);

    expect([...der.subarray(0, 5)]).toEqual([
      0x30,
      2 + 33 + 2 + 30,
      0x02,
      33,
      0,
    ]);
    expect(readDerSignature(der)).toEqual({ _tag: "Read", signature: raw });
  });

  const valid = convertToDerSignature(new Uint8Array(64).fill(0x11));

  test.each([
    ["空", new Uint8Array()],
    ["DER でない", new Uint8Array(64).fill(0x11)],
    [
      "SEQUENCE の長さが合わない",
      new Uint8Array([0x30, valid[1]! + 1, ...valid.subarray(2)]),
    ],
    [
      "末尾に余りがある",
      new Uint8Array([0x30, valid[1]! + 1, ...valid.subarray(2), 0]),
    ],
    ["INTEGER でない", new Uint8Array([0x30, 6, 0x04, 1, 1, 0x02, 1, 1])],
    ["負の数", new Uint8Array([0x30, 6, 0x02, 1, 0x80, 0x02, 1, 1])],
    [
      "33 バイトを超える値",
      new Uint8Array([0x30, 38, 0x02, 34, 1, ...new Uint8Array(33), 0x02, 0]),
    ],
  ])("%s の署名を拒むこと", (_, der) => {
    const read = readDerSignature(der);

    expect(read._tag === "Rejected" ? read.problem : "").toContain(
      "ES256 の署名",
    );
  });
});
