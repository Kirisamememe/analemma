import { describe, expect, test } from "bun:test";

import { parseAuthenticatorData } from "@/features/auth/webauthn/authenticator-data/parse-authenticator-data";
import {
  AUTHENTICATOR_FLAG,
  buildAuthenticatorData,
  hashRpId,
} from "@/features/auth/webauthn/fake-authenticator/build-authenticator-data";
import {
  type CborInput,
  encodeCbor,
} from "@/features/auth/webauthn/fake-authenticator/encode-cbor";

const F = AUTHENTICATOR_FLAG;

const rpIdHash = await hashRpId("analemma.test");
const publicKey = encodeCbor(
  new Map<number, CborInput>([
    [1, 1],
    [3, -8],
    [-1, 6],
    [-2, new Uint8Array(32).fill(7)],
  ]),
);
const credential = {
  aaguid: new Uint8Array(16).fill(0xaa),
  credentialId: new Uint8Array([1, 2, 3, 4, 5]),
  publicKey,
};
const extensions = encodeCbor(new Map([["credProtect", 2]]));

const flagsOf = (flags: number): unknown => {
  const parsed = parseAuthenticatorData(
    buildAuthenticatorData({ rpIdHash, flags, signCount: 0 }),
  );

  return parsed._tag === "Parsed" ? parsed.flags : parsed;
};

const problemOf = (bytes: Uint8Array<ArrayBuffer>): string => {
  const parsed = parseAuthenticatorData(bytes);

  return parsed._tag === "Rejected" ? parsed.problem : "";
};

describe("authenticatorData の読み取り", () => {
  test("資格情報の無いログインの形から、rpIdHash・flags・signCount を読むこと", () => {
    expect(
      parseAuthenticatorData(
        buildAuthenticatorData({
          rpIdHash,
          flags: F.UP | F.UV | F.BE | F.BS,
          signCount: 0x01_02_03_04,
        }),
      ),
    ).toEqual({
      _tag: "Parsed",
      rpIdHash,
      flags: {
        userPresent: true,
        userVerified: true,
        backupEligible: true,
        backedUp: true,
      },
      signCount: 0x01_02_03_04,
    });
  });

  test("flags のビットを1つずつ見分け、予約のビットは無視すること", () => {
    expect(flagsOf(F.UP)).toEqual({
      userPresent: true,
      userVerified: false,
      backupEligible: false,
      backedUp: false,
    });
    expect(flagsOf(F.UV)).toMatchObject({ userVerified: true });
    expect(flagsOf(F.BE)).toMatchObject({ backupEligible: true });
    expect(flagsOf(F.BS)).toMatchObject({ backedUp: true });
    expect(flagsOf(0x02 | 0x20)).toEqual(flagsOf(0));
  });

  test("AT のとき、aaguid・資格情報の ID・公開鍵を読むこと", () => {
    expect(
      parseAuthenticatorData(
        buildAuthenticatorData({
          rpIdHash,
          flags: F.UP | F.AT,
          signCount: 0,
          credential,
        }),
      ),
    ).toMatchObject({ attestedCredential: credential });
  });

  test("ED のとき、資格情報の有無によらず、拡張を読み飛ばすこと", () => {
    expect(
      parseAuthenticatorData(
        buildAuthenticatorData({
          rpIdHash,
          flags: F.UP | F.AT | F.ED,
          signCount: 0,
          credential,
          extensions,
        }),
      ),
    ).toMatchObject({ attestedCredential: { publicKey } });
    expect(
      parseAuthenticatorData(
        buildAuthenticatorData({
          rpIdHash,
          flags: F.UP | F.ED,
          signCount: 0,
          extensions,
        }),
      ),
    ).not.toHaveProperty("attestedCredential");
  });

  test("ED が立っていない拡張を、末尾の余りとして拒むこと", () => {
    expect(
      problemOf(
        buildAuthenticatorData({
          rpIdHash,
          flags: F.UP,
          signCount: 0,
          extensions,
        }),
      ),
    ).toContain("余り");
    expect(
      problemOf(
        buildAuthenticatorData({
          rpIdHash,
          flags: F.UP | F.AT,
          signCount: 0,
          credential,
          extensions,
        }),
      ),
    ).toContain("余り");
  });

  test("短すぎるもの・途中で切れているもの・形の違う拡張を拒むこと", () => {
    const full = buildAuthenticatorData({
      rpIdHash,
      flags: F.UP | F.AT,
      signCount: 0,
      credential,
    });

    expect(problemOf(full.subarray(0, 36))).toContain("短すぎる");
    expect(problemOf(full.subarray(0, 50))).toContain("切れている");
    expect(problemOf(full.subarray(0, 57))).toContain("切れている");
    expect(problemOf(full.subarray(0, -1))).toContain("切れている");
    expect(
      problemOf(
        buildAuthenticatorData({
          rpIdHash,
          flags: F.UP | F.ED,
          signCount: 0,
          extensions: encodeCbor([1, 2]),
        }),
      ),
    ).toContain("map でない");
  });
});
