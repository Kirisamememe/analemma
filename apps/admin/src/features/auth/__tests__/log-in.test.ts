import { describe, expect, test } from "bun:test";

import {
  createFakeApi,
  type FakeReply,
} from "../../../testing/create-fake-api";
import { logIn } from "../log-in";
import type { Authenticator } from "../webauthn/create-authenticator";

const OPTIONS = {
  challenge: "AQID",
  rpId: "localhost",
  allowCredentials: [],
  userVerification: "required",
  timeout: 300_000,
};

const CREDENTIAL = {
  id: "credential-id",
  type: "public-key" as const,
  response: {
    clientDataJSON: "AQ",
    authenticatorData: "Ag",
    signature: "Aw",
    userHandle: "BA",
  },
};

const answering: Authenticator = {
  authenticate: () =>
    Promise.resolve({ _tag: "Answered", credential: CREDENTIAL }),
  register: () => Promise.resolve({ _tag: "Cancelled" }),
};

const cancelling: Authenticator = {
  authenticate: () => Promise.resolve({ _tag: "Cancelled" }),
  register: () => Promise.resolve({ _tag: "Cancelled" }),
};

const serverReplying = (verify: FakeReply) => {
  let sent: unknown;
  const fake = createFakeApi({
    "auth/login/options": () => ({ output: OPTIONS }),
    "auth/login/verify": (input) => {
      sent = input;

      return verify;
    },
  });

  return { ...fake, sent: () => sent };
};

describe("logIn", () => {
  test("認証器の資格情報を server に確かめさせ、ログインする", async () => {
    const server = serverReplying({
      output: { expiresAt: "2026-01-08T00:00:00.000Z" },
    });

    expect(await logIn({ api: server.api, authenticator: answering })).toEqual({
      _tag: "LoggedIn",
    });
    expect(server.sent()).toEqual(CREDENTIAL);
  });

  test("認証器で取り消したら、server に確かめさせない", async () => {
    const server = serverReplying({ output: {} });

    expect(await logIn({ api: server.api, authenticator: cancelling })).toEqual(
      { _tag: "Cancelled" },
    );
    expect(server.calls).toEqual(["auth/login/options"]);
  });

  test.each([
    { error: "CHALLENGE_EXPIRED", status: 400, expected: "ChallengeExpired" },
    { error: "UNKNOWN_CREDENTIAL", status: 401, expected: "UnknownPasskey" },
    { error: "INVALID_CREDENTIAL", status: 401, expected: "Rejected" },
  ])(
    "server の $error を $expected として返す",
    async ({ error, status, expected }) => {
      const server = serverReplying({ error, status });

      expect(
        await logIn({ api: server.api, authenticator: answering }),
      ).toEqual({ _tag: expected });
    },
  );

  test("origin を断られたら(設定の誤り)、想定外の失敗として throw する", () => {
    const server = serverReplying({ error: "FORBIDDEN", status: 403 });

    expect(
      logIn({ api: server.api, authenticator: answering }),
    ).rejects.toThrow();
  });
});
