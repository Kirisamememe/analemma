import { describe, expect, test } from "bun:test";

import {
  type WebAuthn,
  createAuthenticator,
} from "@/features/auth/webauthn/create-authenticator";

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

const ASSERTION_JSON = {
  id: "Y3JlZGVudGlhbA",
  rawId: "Y3JlZGVudGlhbA",
  type: "public-key",
  authenticatorAttachment: "platform",
  clientExtensionResults: {},
  response: {
    clientDataJSON: "AQ",
    authenticatorData: "Ag",
    signature: "Aw",
    userHandle: "BA",
  },
};

const ATTESTATION_JSON = {
  id: "Y3JlZGVudGlhbA",
  rawId: "Y3JlZGVudGlhbA",
  type: "public-key",
  authenticatorAttachment: "platform",
  clientExtensionResults: {},
  response: {
    clientDataJSON: "AQ",
    attestationObject: "Ag",
    authenticatorData: "Aw",
    publicKey: "BA",
    publicKeyAlgorithm: -8,
    transports: ["internal"],
  },
};

const answering = (json: unknown): WebAuthn => ({
  get: () => Promise.resolve(json),
  create: () => Promise.resolve(json),
});

const throwing = (name: string): WebAuthn => ({
  get: () => Promise.reject(new DOMException("", name)),
  create: () => Promise.reject(new DOMException("", name)),
});

describe("createAuthenticator", () => {
  test("server の options をそのまま渡し、toJSON() の値を server に送る資格情報として返す", async () => {
    const received: unknown[] = [];
    const authenticator = createAuthenticator({
      get: (options) => {
        received.push(options);

        return Promise.resolve(ASSERTION_JSON);
      },
      create: () => Promise.resolve(null),
    });

    expect(await authenticator.authenticate(AUTHENTICATION_OPTIONS)).toEqual({
      _tag: "Answered",
      credential: {
        id: "Y3JlZGVudGlhbA",
        type: "public-key",
        response: {
          clientDataJSON: "AQ",
          authenticatorData: "Ag",
          signature: "Aw",
          userHandle: "BA",
        },
      },
    });
    expect(received).toEqual([AUTHENTICATION_OPTIONS]);
  });

  test("作ったパスキーの toJSON() の値を、server に送る資格情報として返す", async () => {
    const authenticator = createAuthenticator(answering(ATTESTATION_JSON));

    expect(await authenticator.register(REGISTRATION_OPTIONS)).toEqual({
      _tag: "Answered",
      credential: {
        id: "Y3JlZGVudGlhbA",
        type: "public-key",
        response: {
          clientDataJSON: "AQ",
          attestationObject: "Ag",
          transports: ["internal"],
        },
      },
    });
  });

  test("toJSON() の値が資格情報の形でなければ、想定外の失敗として throw する", () => {
    const authenticator = createAuthenticator(
      answering({ ...ASSERTION_JSON, response: { clientDataJSON: "AQ" } }),
    );

    expect(
      authenticator.authenticate(AUTHENTICATION_OPTIONS),
    ).rejects.toThrow();
  });

  test("userHandle だけが無いログインの応答も、想定外の失敗として throw する", () => {
    const { userHandle: _userHandle, ...response } = ASSERTION_JSON.response;
    const authenticator = createAuthenticator(
      answering({ ...ASSERTION_JSON, response }),
    );

    expect(
      authenticator.authenticate(AUTHENTICATION_OPTIONS),
    ).rejects.toThrow();
  });

  test("登録では、server の options をそのまま渡し、資格情報の形でない toJSON() の値は throw する", () => {
    const received: unknown[] = [];
    const authenticator = createAuthenticator({
      get: () => Promise.resolve(null),
      create: (options) => {
        received.push(options);

        return Promise.resolve(ASSERTION_JSON);
      },
    });

    const registered = authenticator.register(REGISTRATION_OPTIONS);

    expect(received).toEqual([REGISTRATION_OPTIONS]);
    expect(registered).rejects.toThrow();
  });

  test.each(["NotAllowedError", "AbortError", "TimeoutError"])(
    "利用者がキャンセルしたとき(%s)は、キャンセルとして返す",
    async (name) => {
      const authenticator = createAuthenticator(throwing(name));

      expect(await authenticator.authenticate(AUTHENTICATION_OPTIONS)).toEqual({
        _tag: "Cancelled",
      });
      expect(await authenticator.register(REGISTRATION_OPTIONS)).toEqual({
        _tag: "Cancelled",
      });
    },
  );

  test("登録済みの認証器で作ろうとしたときは、そのことを返す", async () => {
    const authenticator = createAuthenticator(throwing("InvalidStateError"));

    expect(await authenticator.register(REGISTRATION_OPTIONS)).toEqual({
      _tag: "AlreadyRegistered",
    });
  });

  test("資格情報が返らなければ、キャンセルとして返す", async () => {
    const authenticator = createAuthenticator(answering(null));

    expect(await authenticator.authenticate(AUTHENTICATION_OPTIONS)).toEqual({
      _tag: "Cancelled",
    });
  });

  test("想定外の失敗は、そのまま throw する", () => {
    const authenticator = createAuthenticator(throwing("SecurityError"));

    expect(
      authenticator.authenticate(AUTHENTICATION_OPTIONS),
    ).rejects.toThrow();
  });

  test("パスキーを作るときは、渡した signal を認証器に渡す", async () => {
    const received: unknown[] = [];
    const authenticator = createAuthenticator({
      get: () => Promise.resolve(null),
      create: (_options, signal) => {
        received.push(signal);

        return Promise.resolve(null);
      },
    });
    const signal = new AbortController().signal;

    await authenticator.register(REGISTRATION_OPTIONS, signal);

    expect(received).toEqual([signal]);
  });
});
