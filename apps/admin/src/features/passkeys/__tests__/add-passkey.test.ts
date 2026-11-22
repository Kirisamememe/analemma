import { describe, expect, test } from "bun:test";

import {
  createFakeApi,
  type FakeOutput,
  type FakeReply,
} from "../../../testing/create-fake-api";
import {
  FAKE_ASSERTION,
  FAKE_ATTESTATION,
  createFakeAuthenticator,
} from "../../../testing/create-fake-authenticator";
import type { Authenticator } from "../../auth/webauthn/create-authenticator";
import { addPasskey } from "../add-passkey";

const AUTHENTICATION_OPTIONS: FakeOutput<"admin/session/reauthenticationOptions"> =
  {
    challenge: "AQID",
    rpId: "localhost",
    allowCredentials: [],
    userVerification: "required",
    timeout: 300_000,
  };

const REGISTRATION_OPTIONS: FakeOutput<"admin/passkeys/registrationOptions"> = {
  challenge: "BAUG",
  rp: { id: "localhost", name: "Analemma" },
  user: { id: "BAU", name: "admin", displayName: "管理者" },
  pubKeyCredParams: [{ type: "public-key", alg: -8 }],
  excludeCredentials: [],
  authenticatorSelection: {
    residentKey: "required",
    requireResidentKey: true,
    userVerification: "required",
  },
  attestation: "none",
  timeout: 300_000,
};

const SUMMARY = {
  id: "new-passkey",
  name: "iPhone",
  createdAt: "2026-01-01T00:00:00.000Z",
  lastUsedAt: "2026-01-01T00:00:00.000Z",
  backedUp: true,
};

const serverReplying = (register: FakeReply<"admin/passkeys/register">) => {
  let sent: unknown;
  const fake = createFakeApi({
    "admin/session/reauthenticationOptions": () => ({
      output: AUTHENTICATION_OPTIONS,
    }),
    "admin/passkeys/registrationOptions": () => ({
      output: REGISTRATION_OPTIONS,
    }),
    "admin/passkeys/register": (input) => {
      sent = input;

      return register;
    },
  });

  return { ...fake, sent: () => sent };
};

describe("addPasskey", () => {
  test("再認証をしてから、作ったパスキーを再認証の資格情報と一緒に送る", async () => {
    const server = serverReplying({ output: SUMMARY });

    expect(
      await addPasskey(
        { api: server.api, authenticator: createFakeAuthenticator() },
        "iPhone",
      ),
    ).toEqual({ _tag: "Added" });
    expect(server.calls).toEqual([
      "admin/session/reauthenticationOptions",
      "admin/passkeys/registrationOptions",
      "admin/passkeys/register",
    ]);
    expect(server.sent()).toEqual({
      name: "iPhone",
      credential: FAKE_ATTESTATION,
      assertion: FAKE_ASSERTION,
    });
  });

  test("再認証をキャンセルしたら、パスキーを作らせない", async () => {
    const server = serverReplying({ output: SUMMARY });

    expect(
      await addPasskey(
        {
          api: server.api,
          authenticator: createFakeAuthenticator({
            authenticate: { _tag: "Cancelled" },
          }),
        },
        "iPhone",
      ),
    ).toEqual({ _tag: "Cancelled" });
    expect(server.calls).toEqual(["admin/session/reauthenticationOptions"]);
  });

  test("登録済みの認証器なら、送らずにそのことを返す", async () => {
    const server = serverReplying({ output: SUMMARY });

    expect(
      await addPasskey(
        {
          api: server.api,
          authenticator: createFakeAuthenticator({
            register: { _tag: "AlreadyRegistered" },
          }),
        },
        "iPhone",
      ),
    ).toEqual({ _tag: "AlreadyRegistered" });
    expect(server.calls).not.toContain("admin/passkeys/register");
  });

  test.each([
    {
      error: "REAUTHENTICATION_FAILED",
      expected: "ReauthenticationFailed",
    },
    { error: "CHALLENGE_EXPIRED", expected: "ChallengeExpired" },
    {
      error: "DUPLICATE_CREDENTIAL",
      expected: "AlreadyRegistered",
    },
    { error: "INVALID_CREDENTIAL", expected: "Rejected" },
  ] satisfies (FakeReply<"admin/passkeys/register"> &
    Record<"expected", Awaited<ReturnType<typeof addPasskey>>["_tag"]>)[])(
    "server の $error を $expected として返す",
    async ({ error, expected }) => {
      const server = serverReplying({ error });

      expect(
        await addPasskey(
          { api: server.api, authenticator: createFakeAuthenticator() },
          "iPhone",
        ),
      ).toEqual({ _tag: expected });
    },
  );

  test("セッションが切れていたら、throw して query client に任せる", () => {
    const server = serverReplying({ error: "UNAUTHORIZED" });

    expect(
      addPasskey(
        { api: server.api, authenticator: createFakeAuthenticator() },
        "iPhone",
      ),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  test("新しいパスキーを作る時間を、再認証の challenge が切れる前までに絞る", async () => {
    const server = serverReplying({ output: SUMMARY });
    const timeouts: number[] = [];
    const fake = createFakeAuthenticator();
    const authenticator: Authenticator = {
      authenticate: fake.authenticate,
      register: async (options) => {
        timeouts.push(options.timeout);

        return fake.register(options);
      },
    };
    let clock = 0;

    await addPasskey(
      {
        api: server.api,
        authenticator,
        now: () => {
          clock += 60_000;

          return clock;
        },
      },
      "iPhone",
    );

    expect(timeouts).toEqual([230_000]);
  });

  test("再認証の challenge の残りが少なければ、パスキーを作らずに期限切れとして返す", async () => {
    const server = serverReplying({ output: SUMMARY });
    let clock = 0;

    expect(
      await addPasskey(
        {
          api: server.api,
          authenticator: createFakeAuthenticator(),
          now: () => {
            clock += 270_000;

            return clock;
          },
        },
        "iPhone",
      ),
    ).toEqual({ _tag: "ChallengeExpired" });
    expect(server.calls).not.toContain("admin/passkeys/register");
  });

  test("再認証の期限の手前で、パスキーを作るのを止め、期限切れとして返す", async () => {
    const server = serverReplying({ output: SUMMARY });
    const requested: number[] = [];
    const signals: (AbortSignal | undefined)[] = [];
    const authenticator: Authenticator = {
      authenticate: createFakeAuthenticator().authenticate,
      register: (_options, signal) => {
        signals.push(signal);

        return Promise.resolve({ _tag: "Cancelled" });
      },
    };

    expect(
      await addPasskey(
        {
          api: server.api,
          authenticator,
          now: () => 0,
          abortAfter: (milliseconds) => {
            requested.push(milliseconds);

            return AbortSignal.abort();
          },
        },
        "iPhone",
      ),
    ).toEqual({ _tag: "ChallengeExpired" });
    expect(requested).toEqual([290_000]);
    expect(signals[0]?.aborted).toBe(true);
    expect(server.calls).not.toContain("admin/passkeys/register");
  });
});
