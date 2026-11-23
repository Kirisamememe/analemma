import { describe, expect, test } from "bun:test";

import {
  checkDeployTokenName,
  issueDeployToken,
} from "@/features/deploy-tokens/issue/issue-deploy-token";
import type { MessageKey } from "@/i18n/use-translate";
import { createFakeApi, type FakeReply } from "@/testing/create-fake-api";
import {
  FAKE_ASSERTION,
  createFakeAuthenticator,
} from "@/testing/create-fake-authenticator";

const ISSUED = {
  id: "AAAAAAAAAAAAAAAAAAAAAA",
  name: "本番のデプロイ",
  createdAt: "2026-01-02T03:04:00.000Z",
  lastUsedAt: null,
  token: "AAAAAAAAAAAAAAAAAAAAAA.c2VjcmV0",
};

const serverReplying = (reply: FakeReply<"admin/deployTokens/issue">) => {
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
    "admin/deployTokens/issue": (input) => {
      sent = input;

      return reply;
    },
  });

  return { ...fake, sent: () => sent };
};

describe("issueDeployToken", () => {
  test("再認証をしてから、再認証の資格情報と一緒に発行し、token を返す", async () => {
    const server = serverReplying({ output: ISSUED });

    expect(
      await issueDeployToken(
        { api: server.api, authenticator: createFakeAuthenticator() },
        "本番のデプロイ",
      ),
    ).toEqual({ _tag: "Issued", name: "本番のデプロイ", token: ISSUED.token });
    expect(server.sent()).toEqual({
      name: "本番のデプロイ",
      assertion: FAKE_ASSERTION,
    });
  });

  test("再認証をキャンセルしたら、発行しない", async () => {
    const server = serverReplying({ output: ISSUED });

    expect(
      await issueDeployToken(
        {
          api: server.api,
          authenticator: createFakeAuthenticator({
            authenticate: { _tag: "Cancelled" },
          }),
        },
        "本番のデプロイ",
      ),
    ).toEqual({ _tag: "Cancelled" });
    expect(server.calls).toEqual(["admin/session/reauthenticationOptions"]);
  });

  test("server が再認証を断ったら、そのことを返す", async () => {
    const server = serverReplying({ error: "REAUTHENTICATION_FAILED" });

    expect(
      await issueDeployToken(
        { api: server.api, authenticator: createFakeAuthenticator() },
        "本番のデプロイ",
      ),
    ).toEqual({ _tag: "ReauthenticationFailed" });
  });

  test("ほかの失敗は throw する", () => {
    const server = serverReplying({
      error: "INTERNAL_SERVER_ERROR",
      defined: false,
    });

    expect(
      issueDeployToken(
        { api: server.api, authenticator: createFakeAuthenticator() },
        "本番のデプロイ",
      ),
    ).rejects.toMatchObject({ code: "INTERNAL_SERVER_ERROR" });
  });
});

describe("checkDeployTokenName", () => {
  test.each<[string, MessageKey | undefined]>([
    ["本番のデプロイ", undefined],
    ["a".repeat(64), undefined],
    ["", "deployTokens.invalidName"],
    ["   ", "deployTokens.invalidName"],
    ["a".repeat(65), "deployTokens.invalidName"],
    ["本番\nのデプロイ", "deployTokens.invalidName"],
  ])("%p は %p", (name, expected) => {
    expect(checkDeployTokenName(name)).toBe(expected);
  });
});
