import { describe, expect, test } from "bun:test";

import { catchErrorCode } from "../../../test-client/catch-error-code";
import {
  TEST_NOW,
  createTestClient,
} from "../../../test-client/create-test-client";
import { signInAsAdmin } from "../../../test-client/sign-in-as-admin";

describe("デプロイ用のトークンの発行", () => {
  test("token は発行したときだけ返し、一覧には名前と日時だけを出すこと", async () => {
    await using server = await createTestClient();

    await signInAsAdmin(server);

    const issued = await server.client.admin.deployTokens.issue({
      name: "  本番のデプロイ  ",
    });

    expect(issued).toEqual({
      id: issued.token.split(".")[0] ?? "",
      name: "本番のデプロイ",
      createdAt: TEST_NOW.toISOString(),
      lastUsedAt: null,
      token: issued.token,
    });
    expect(issued.token).toMatch(/^[\w\-]{22}\.[\w\-]{43}$/v);
    expect(await server.client.admin.deployTokens.list()).toEqual({
      tokens: [
        {
          id: issued.id,
          name: "本番のデプロイ",
          createdAt: TEST_NOW.toISOString(),
          lastUsedAt: null,
        },
      ],
    });
    expect(JSON.stringify(server.logs)).not.toContain(
      issued.token.split(".")[1],
    );
  });

  test("空の名前や制御文字のある名前では、発行しないこと", async () => {
    await using server = await createTestClient();

    await signInAsAdmin(server);

    for (const name of ["   ", "a\nb", "あ".repeat(65)]) {
      expect(
        await catchErrorCode(server.client.admin.deployTokens.issue({ name })),
      ).toBe("BAD_REQUEST");
    }
  });
});

describe("デプロイ用のトークンの取り消し", () => {
  test("取り消したトークンは一覧から消え、もう一度取り消すと NOT_FOUND になること", async () => {
    await using server = await createTestClient();

    await signInAsAdmin(server);

    const first = await server.client.admin.deployTokens.issue({ name: "1" });
    const second = await server.client.admin.deployTokens.issue({ name: "2" });

    await server.client.admin.deployTokens.revoke({ id: first.id });

    expect(
      (await server.client.admin.deployTokens.list()).tokens.map(
        ({ id }) => id,
      ),
    ).toEqual([second.id]);
    expect(
      await catchErrorCode(
        server.client.admin.deployTokens.revoke({ id: first.id }),
      ),
    ).toBe("NOT_FOUND");
  });
});
