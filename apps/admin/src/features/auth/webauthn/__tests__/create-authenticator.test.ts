import { describe, expect, test } from "bun:test";

import {
  type CredentialStore,
  createAuthenticator,
} from "../create-authenticator";

const AUTHENTICATION_OPTIONS = {
  challenge: "AQID",
  rpId: "localhost",
  allowCredentials: [],
  userVerification: "required" as const,
  timeout: 300_000,
};

const REGISTRATION_OPTIONS = {
  challenge: "AQID",
  rp: { id: "localhost", name: "Analemma" },
  user: { id: "BAU", name: "admin", displayName: "管理者" },
  pubKeyCredParams: [{ type: "public-key" as const, alg: -8 }],
  excludeCredentials: [],
  authenticatorSelection: {
    residentKey: "required" as const,
    requireResidentKey: true as const,
    userVerification: "required" as const,
  },
  attestation: "none" as const,
  timeout: 300_000,
};

const bytes = (...values: number[]): ArrayBuffer =>
  new Uint8Array(values).buffer;

const storeAnswering = (credential: unknown): CredentialStore => ({
  get: () => Promise.resolve(credential),
  create: () => Promise.resolve(credential),
});

const storeThrowing = (name: string): CredentialStore => ({
  get: () => Promise.reject(new DOMException("", name)),
  create: () => Promise.reject(new DOMException("", name)),
});

describe("createAuthenticator", () => {
  test("認証器の応答を、server に送る資格情報にして返す", async () => {
    const authenticator = createAuthenticator(
      storeAnswering({
        id: "credential-id",
        response: {
          clientDataJSON: bytes(1),
          authenticatorData: bytes(2),
          signature: bytes(3),
          userHandle: bytes(4),
        },
      }),
    );

    expect(await authenticator.authenticate(AUTHENTICATION_OPTIONS)).toEqual({
      _tag: "Answered",
      credential: {
        id: "credential-id",
        type: "public-key",
        response: {
          clientDataJSON: "AQ",
          authenticatorData: "Ag",
          signature: "Aw",
          userHandle: "BA",
        },
      },
    });
  });

  test("作ったパスキーを、server に送る資格情報にして返す", async () => {
    const authenticator = createAuthenticator(
      storeAnswering({
        id: "credential-id",
        response: {
          clientDataJSON: bytes(1),
          attestationObject: bytes(2),
          getTransports: () => ["internal"],
        },
      }),
    );

    expect(await authenticator.register(REGISTRATION_OPTIONS)).toEqual({
      _tag: "Answered",
      credential: {
        id: "credential-id",
        type: "public-key",
        response: {
          clientDataJSON: "AQ",
          attestationObject: "Ag",
          transports: ["internal"],
        },
      },
    });
  });

  test.each(["NotAllowedError", "AbortError"])(
    "利用者がキャンセルしたとき(%s)は、キャンセルとして返す",
    async (name) => {
      const authenticator = createAuthenticator(storeThrowing(name));

      expect(await authenticator.authenticate(AUTHENTICATION_OPTIONS)).toEqual({
        _tag: "Cancelled",
      });
      expect(await authenticator.register(REGISTRATION_OPTIONS)).toEqual({
        _tag: "Cancelled",
      });
    },
  );

  test("登録済みの認証器で作ろうとしたときは、そのことを返す", async () => {
    const authenticator = createAuthenticator(
      storeThrowing("InvalidStateError"),
    );

    expect(await authenticator.register(REGISTRATION_OPTIONS)).toEqual({
      _tag: "AlreadyRegistered",
    });
  });

  test("資格情報が返らなければ、キャンセルとして返す", async () => {
    const authenticator = createAuthenticator(storeAnswering(null));

    expect(await authenticator.authenticate(AUTHENTICATION_OPTIONS)).toEqual({
      _tag: "Cancelled",
    });
  });

  test("想定外の失敗は、そのまま throw する", () => {
    const authenticator = createAuthenticator(storeThrowing("SecurityError"));

    expect(
      authenticator.authenticate(AUTHENTICATION_OPTIONS),
    ).rejects.toThrow();
  });

  test("パスキーを作るときは、渡した signal を認証器に渡す", async () => {
    const received: unknown[] = [];
    const authenticator = createAuthenticator({
      get: () => Promise.resolve(null),
      create: (options) => {
        received.push(options.signal);

        return Promise.resolve(null);
      },
    });
    const signal = new AbortController().signal;

    await authenticator.register(REGISTRATION_OPTIONS, signal);

    expect(received).toEqual([signal]);
  });
});
