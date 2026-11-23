import { describe, expect, test } from "bun:test";

import { createFakeApi } from "@/testing/create-fake-api";
import { FAKE_ASSERTION } from "@/testing/create-fake-authenticator";
import { createDeployTokenRoutes } from "@/testing/fake-routes/create-deploy-token-routes";

const setUp = (names: readonly string[]) => {
  const server = createDeployTokenRoutes(
    names.map((name) => ({ name, lastUsedAt: null })),
  );

  return { server, api: createFakeApi(server.routes).api };
};

describe("createDeployTokenRoutes", () => {
  test("再認証の後なら発行でき、token は発行の応答にだけ入る", async () => {
    const { api } = setUp(["本番のデプロイ"]);

    await api.admin.session.reauthenticationOptions();

    const issued = await api.admin.deployTokens.issue({
      name: " 手元の確認 ",
      assertion: FAKE_ASSERTION,
    });

    const { tokens } = await api.admin.deployTokens.list();

    expect(issued.name).toBe("手元の確認");
    expect(issued.token).toStartWith(`${issued.id}.`);
    expect(tokens.map(({ name }) => name)).toEqual([
      "本番のデプロイ",
      "手元の確認",
    ]);
    expect(JSON.stringify(tokens)).not.toContain(issued.token);
  });

  test("1つの再認証で、発行は1回だけ", async () => {
    const { api } = setUp([]);

    await api.admin.session.reauthenticationOptions();
    await api.admin.deployTokens.issue({
      name: "本番のデプロイ",
      assertion: FAKE_ASSERTION,
    });

    expect(
      api.admin.deployTokens.issue({
        name: "手元の確認",
        assertion: FAKE_ASSERTION,
      }),
    ).rejects.toMatchObject({ code: "REAUTHENTICATION_FAILED" });
  });

  test("取り消したトークンは一覧から外し、もう一度取り消すと NOT_FOUND にする", async () => {
    const { server, api } = setUp(["本番のデプロイ", "手元の確認"]);
    const [first] = server.tokens();

    await api.admin.deployTokens.revoke({ id: first!.id });

    expect(server.tokens().map(({ name }) => name)).toEqual(["手元の確認"]);
    expect(
      api.admin.deployTokens.revoke({ id: first!.id }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  test("次の1回だけ、決めた応答を返す", async () => {
    const { server, api } = setUp(["本番のデプロイ"]);

    server.replyNext("admin/deployTokens/list", () => ({
      error: "INTERNAL_SERVER_ERROR",
      defined: false,
    }));

    expect(api.admin.deployTokens.list()).rejects.toMatchObject({
      code: "INTERNAL_SERVER_ERROR",
    });
    expect((await api.admin.deployTokens.list()).tokens).toHaveLength(1);
  });
});
