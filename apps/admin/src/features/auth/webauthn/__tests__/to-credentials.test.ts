import { describe, expect, test } from "bun:test";

import {
  toAuthenticationCredential,
  toRegistrationCredential,
} from "../to-credentials";

const bytes = (...values: number[]): ArrayBuffer =>
  new Uint8Array(values).buffer;

describe("toAuthenticationCredential", () => {
  test("ログインの応答のバイト列を、base64url にして送る形にする", () => {
    expect(
      toAuthenticationCredential({
        id: "credential-id",
        response: {
          clientDataJSON: bytes(1),
          authenticatorData: bytes(2),
          signature: bytes(3),
          userHandle: bytes(4),
        },
      }),
    ).toEqual({
      id: "credential-id",
      type: "public-key",
      response: {
        clientDataJSON: "AQ",
        authenticatorData: "Ag",
        signature: "Aw",
        userHandle: "BA",
      },
    });
  });

  test("user handle が無ければ、空の文字列にする(server が断る)", () => {
    expect(
      toAuthenticationCredential({
        id: "credential-id",
        response: {
          clientDataJSON: bytes(1),
          authenticatorData: bytes(2),
          signature: bytes(3),
          userHandle: null,
        },
      }).response.userHandle,
    ).toBe("");
  });
});

describe("toRegistrationCredential", () => {
  test("登録の応答を、transports と一緒に送る形にする", () => {
    expect(
      toRegistrationCredential({
        id: "credential-id",
        response: {
          clientDataJSON: bytes(1),
          attestationObject: bytes(2),
          getTransports: () => ["internal", "hybrid"],
        },
      }),
    ).toEqual({
      id: "credential-id",
      type: "public-key",
      response: {
        clientDataJSON: "AQ",
        attestationObject: "Ag",
        transports: ["internal", "hybrid"],
      },
    });
  });
});
