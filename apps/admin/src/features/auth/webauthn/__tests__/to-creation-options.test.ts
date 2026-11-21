import { describe, expect, test } from "bun:test";

import { toCreationOptions } from "../to-creation-options";

const bytesOf = (source: BufferSource): number[] => [
  ...(ArrayBuffer.isView(source)
    ? new Uint8Array(source.buffer, source.byteOffset, source.byteLength)
    : new Uint8Array(source)),
];

const OPTIONS = {
  challenge: "AQID",
  rp: { id: "localhost", name: "Analemma" },
  user: { id: "BAU", name: "admin", displayName: "管理者" },
  pubKeyCredParams: [{ type: "public-key" as const, alg: -8 }],
  excludeCredentials: [
    {
      type: "public-key" as const,
      id: "Bgc",
      transports: ["internal", "hybrid", "smart-card", "future-transport"],
    },
  ],
  authenticatorSelection: {
    residentKey: "required" as const,
    requireResidentKey: true as const,
    userVerification: "required" as const,
  },
  attestation: "none" as const,
  timeout: 300_000,
};

describe("toCreationOptions", () => {
  test("challenge と user handle と、登録済みの資格情報の ID をバイト列にする", () => {
    const options = toCreationOptions(OPTIONS);

    expect(bytesOf(options.challenge)).toEqual([1, 2, 3]);
    expect(bytesOf(options.user.id)).toEqual([4, 5]);
    expect(options.excludeCredentials?.map(({ id }) => bytesOf(id))).toEqual([
      [6, 7],
    ]);
  });

  test("ブラウザの型に無い通信の手段は渡さない", () => {
    expect(
      toCreationOptions(OPTIONS).excludeCredentials?.map(
        ({ transports }) => transports,
      ),
    ).toEqual([["internal", "hybrid"]]);
  });

  test("RP と user の名前と、認証器の選び方をそのまま渡す", () => {
    const options = toCreationOptions(OPTIONS);

    expect({
      rp: options.rp,
      name: options.user.name,
      displayName: options.user.displayName,
      authenticatorSelection: options.authenticatorSelection,
      pubKeyCredParams: options.pubKeyCredParams,
      attestation: options.attestation,
    }).toEqual({
      rp: OPTIONS.rp,
      name: "admin",
      displayName: "管理者",
      authenticatorSelection: OPTIONS.authenticatorSelection,
      pubKeyCredParams: OPTIONS.pubKeyCredParams,
      attestation: "none",
    });
  });
});
