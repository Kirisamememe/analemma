import { describe, expect, test } from "bun:test";

import {
  type FakeReply,
  createFakeApi,
} from "../../../testing/create-fake-api";
import {
  FAKE_ASSERTION,
  FAKE_ATTESTATION,
  createFakeAuthenticator,
} from "../../../testing/create-fake-authenticator";
import { addPasskey } from "../add-passkey";

const AUTHENTICATION_OPTIONS = {
  challenge: "AQID",
  rpId: "localhost",
  allowCredentials: [],
  userVerification: "required",
  timeout: 300_000,
};

const REGISTRATION_OPTIONS = {
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

const serverReplying = (register: FakeReply) => {
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
  test("今のパスキーで確かめ直してから、作ったパスキーを再認証の資格情報と一緒に送る", async () => {
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

  test("再認証を取り消したら、パスキーを作らせない", async () => {
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
      status: 403,
      expected: "ReauthenticationFailed",
    },
    { error: "CHALLENGE_EXPIRED", status: 400, expected: "ChallengeExpired" },
    {
      error: "DUPLICATE_CREDENTIAL",
      status: 409,
      expected: "AlreadyRegistered",
    },
    { error: "INVALID_CREDENTIAL", status: 400, expected: "Rejected" },
  ])(
    "server の $error を $expected として返す",
    async ({ error, status, expected }) => {
      const server = serverReplying({ error, status });

      expect(
        await addPasskey(
          { api: server.api, authenticator: createFakeAuthenticator() },
          "iPhone",
        ),
      ).toEqual({ _tag: expected });
    },
  );

  test("セッションが切れていたら、throw して query client に任せる", () => {
    const server = serverReplying({ error: "UNAUTHORIZED", status: 401 });

    expect(
      addPasskey(
        { api: server.api, authenticator: createFakeAuthenticator() },
        "iPhone",
      ),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
