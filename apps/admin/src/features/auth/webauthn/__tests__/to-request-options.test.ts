import { describe, expect, test } from "bun:test";

import { toRequestOptions } from "../to-request-options";

const bytesOf = (source: BufferSource): number[] => [
  ...(ArrayBuffer.isView(source)
    ? new Uint8Array(source.buffer, source.byteOffset, source.byteLength)
    : new Uint8Array(source)),
];

describe("toRequestOptions", () => {
  test("challenge をバイト列にし、ほかの値をそのまま渡す", () => {
    const { challenge, ...rest } = toRequestOptions({
      challenge: "AQID",
      rpId: "localhost",
      allowCredentials: [],
      userVerification: "required",
      timeout: 300_000,
    });

    expect(bytesOf(challenge)).toEqual([1, 2, 3]);
    expect(rest).toEqual({
      rpId: "localhost",
      allowCredentials: [],
      userVerification: "required",
      timeout: 300_000,
    });
  });
});
