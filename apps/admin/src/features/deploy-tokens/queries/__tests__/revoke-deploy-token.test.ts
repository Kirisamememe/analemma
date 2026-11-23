import { describe, expect, test } from "bun:test";

import { revokeDeployToken } from "@/features/deploy-tokens/queries/revoke-deploy-token";
import { createFakeApi, type FakeReply } from "@/testing/create-fake-api";

const ID = "AAAAAAAAAAAAAAAAAAAAAA";

const apiReplying = (reply: FakeReply<"admin/deployTokens/revoke">) =>
  createFakeApi({ "admin/deployTokens/revoke": () => reply }).api;

describe("revokeDeployToken", () => {
  test("再認証をせずに取り消す", async () => {
    const fake = createFakeApi({
      "admin/deployTokens/revoke": () => ({ output: undefined }),
    });

    expect(await revokeDeployToken(fake.api, ID)).toEqual({
      _tag: "Revoked",
    });
    expect(fake.calls).toEqual(["admin/deployTokens/revoke"]);
  });

  test("もう無いトークンなら、そのことを返す", async () => {
    expect(
      await revokeDeployToken(apiReplying({ error: "NOT_FOUND" }), ID),
    ).toEqual({ _tag: "NotFound" });
  });

  test("ほかの失敗は throw する", () => {
    expect(
      revokeDeployToken(
        apiReplying({ error: "INTERNAL_SERVER_ERROR", defined: false }),
        ID,
      ),
    ).rejects.toMatchObject({ code: "INTERNAL_SERVER_ERROR" });
  });
});
