import { describe, expect, test } from "bun:test";

import { deletePasskey } from "@/features/passkeys/delete-passkey";
import { createFakeApi, type FakeReply } from "@/testing/create-fake-api";
import {
  FAKE_ASSERTION,
  createFakeAuthenticator,
} from "@/testing/create-fake-authenticator";

const serverReplying = (reply: FakeReply<"admin/passkeys/delete">) => {
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
  test("再認証をしてから、再認証の資格情報と一緒に削除する", async () => {
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

  test("再認証をキャンセルしたら、削除しない", async () => {
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
      expected: "ReauthenticationFailed",
    },
    { error: "LAST_PASSKEY", expected: "LastPasskey" },
    { error: "NOT_FOUND", expected: "NotFound" },
  ] satisfies (FakeReply<"admin/passkeys/delete"> &
    Record<"expected", Awaited<ReturnType<typeof deletePasskey>>["_tag"]>)[])(
    "server の $error を $expected として返す",
    async ({ error, expected }) => {
      const server = serverReplying({ error });

      expect(
        await deletePasskey(
          { api: server.api, authenticator: createFakeAuthenticator() },
          "old-passkey",
        ),
      ).toEqual({ _tag: expected });
    },
  );
});
