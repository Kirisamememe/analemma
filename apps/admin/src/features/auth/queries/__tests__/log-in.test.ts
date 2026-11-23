import { describe, expect, test } from "bun:test";

import { logIn } from "@/features/auth/queries/log-in";
import type { Authenticator } from "@/features/auth/webauthn";
import {
  createFakeApi,
  type FakeOutput,
  type FakeReply,
} from "@/testing/create-fake-api";

const OPTIONS: FakeOutput<"auth/login/options"> = {
  challenge: "AQID",
  rpId: "localhost",
  allowCredentials: [],
  userVerification: "required",
  timeout: 300_000,
};

const CREDENTIAL = {
  id: "credential-ids",
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

const serverReplying = (verify: FakeReply<"auth/login/verify">) => {
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

  test("認証器でキャンセルしたら、server に確かめさせない", async () => {
    const server = serverReplying({
      output: { expiresAt: "2026-01-08T00:00:00.000Z" },
    });

    expect(await logIn({ api: server.api, authenticator: cancelling })).toEqual(
      { _tag: "Cancelled" },
    );
    expect(server.calls).toEqual(["auth/login/options"]);
  });

  test.each([
    { error: "CHALLENGE_EXPIRED", expected: "ChallengeExpired" },
    { error: "UNKNOWN_CREDENTIAL", expected: "UnknownPasskey" },
    { error: "INVALID_CREDENTIAL", expected: "Rejected" },
  ] satisfies (FakeReply<"auth/login/verify"> &
    Record<"expected", Awaited<ReturnType<typeof logIn>>["_tag"]>)[])(
    "server の $error を $expected として返す",
    async ({ error, expected }) => {
      const server = serverReplying({ error });

      expect(
        await logIn({ api: server.api, authenticator: answering }),
      ).toEqual({ _tag: expected });
    },
  );

  test("origin を断られたら(設定の誤り)、想定外の失敗として throw する", () => {
    const server = serverReplying({ error: "FORBIDDEN" });

    expect(
      logIn({ api: server.api, authenticator: answering }),
    ).rejects.toThrow();
  });
});
