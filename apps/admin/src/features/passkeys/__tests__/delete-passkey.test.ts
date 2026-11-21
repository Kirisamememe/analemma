import { describe, expect, test } from "bun:test";

import {
  type FakeReply,
  createFakeApi,
} from "../../../testing/create-fake-api";
import {
  FAKE_ASSERTION,
  createFakeAuthenticator,
} from "../../../testing/create-fake-authenticator";
import { deletePasskey } from "../delete-passkey";

const serverReplying = (reply: FakeReply) => {
  let sent: unknown;
  const fake = createFakeApi({
    "admin/session/reauthenticationOptions": () => ({
      output: {
        challenge: "AQID",
        rpId: "localhost",
        allowCredentials: [],
        userVerification: "required",
        timeout: 300_000,
      },
    }),
    "admin/passkeys/delete": (input) => {
      sent = input;

      return reply;
    },
  });

  return { ...fake, sent: () => sent };
};

describe("deletePasskey", () => {
  test("今のパスキーで確かめ直してから、再認証の資格情報と一緒に消す", async () => {
    const server = serverReplying({ output: undefined });

    expect(
      await deletePasskey(
        { api: server.api, authenticator: createFakeAuthenticator() },
        "old-passkey",
      ),
    ).toEqual({ _tag: "Deleted" });
    expect(server.sent()).toEqual({
      id: "old-passkey",
      assertion: FAKE_ASSERTION,
    });
  });

  test("再認証を取り消したら、消さない", async () => {
    const server = serverReplying({ output: undefined });

    expect(
      await deletePasskey(
        {
          api: server.api,
          authenticator: createFakeAuthenticator({
            authenticate: { _tag: "Cancelled" },
          }),
        },
        "old-passkey",
      ),
    ).toEqual({ _tag: "Cancelled" });
    expect(server.calls).not.toContain("admin/passkeys/delete");
  });

  test.each([
    {
      error: "REAUTHENTICATION_FAILED",
      status: 403,
      expected: "ReauthenticationFailed",
    },
    { error: "LAST_PASSKEY", status: 409, expected: "LastPasskey" },
    { error: "NOT_FOUND", status: 404, expected: "NotFound" },
  ])(
    "server の $error を $expected として返す",
    async ({ error, status, expected }) => {
      const server = serverReplying({ error, status });

      expect(
        await deletePasskey(
          { api: server.api, authenticator: createFakeAuthenticator() },
          "old-passkey",
        ),
      ).toEqual({ _tag: expected });
    },
  );
});
