import { describe, expect, test } from "bun:test";

import { contract } from "@analemma/contract";

import { createFakeAuthenticator } from "@/features/auth/webauthn/fake-authenticator/create-fake-authenticator";
import {
  answerReauthentication,
  SUCCEEDED,
  catchErrorCode,
  TEST_INTERNAL_URL,
  TEST_NOW,
  createTestClient,
  listProcedurePaths,
  issueTestDeployToken,
  signInAsAdmin,
} from "@/test-client";

const deployPaths = listProcedurePaths(contract.deploy, "deploy");

const pushNothing = async (
  token: string | undefined,
  server: Awaited<ReturnType<typeof createTestClient>>,
): Promise<string> =>
  catchErrorCode(server.internal(token).deploy.kinds.push({ kinds: [] }));

describe("デプロイ用のトークンの発行", () => {
  test("token は発行したときだけ返し、一覧には名前と日時だけを出すこと", async () => {
    let now = TEST_NOW;
    await using server = await createTestClient({ clock: { now: () => now } });

    const { passkey } = await signInAsAdmin(server);

    const issued = await server.client.admin.deployTokens.issue({
      name: "  本番のデプロイ  ",
      assertion: await answerReauthentication(server, passkey),
    });

    expect(issued).toEqual({
      id: issued.token.split(".")[0] ?? "",
      name: "本番のデプロイ",
      createdAt: TEST_NOW.toISOString(),
      lastUsedAt: null,
      token: issued.token,
    });
    expect(issued.token).toMatch(/^[\w\-]{22}\.[\w\-]{43}$/v);

    now = new Date(TEST_NOW.getTime() + 60_000);
    await server.internal(issued.token).deploy.kinds.push({ kinds: [] });

    expect(await server.client.admin.deployTokens.list()).toEqual({
      tokens: [
        {
          id: issued.id,
          name: "本番のデプロイ",
          createdAt: TEST_NOW.toISOString(),
          lastUsedAt: now.toISOString(),
        },
      ],
    });
    expect(JSON.stringify(server.logs)).not.toContain(
      issued.token.split(".")[1],
    );
  });

  test("空の名前や制御文字のある名前では、発行しないこと", async () => {
    await using server = await createTestClient();

    const { passkey } = await signInAsAdmin(server);

    for (const name of ["   ", "a\nb", "あ".repeat(65)]) {
      expect(
        await catchErrorCode(
          server.client.admin.deployTokens.issue({
            name,
            assertion: await answerReauthentication(server, passkey),
          }),
        ),
      ).toBe("BAD_REQUEST");
    }
  });

  test("今のパスキーで確かめ直せなければ、REAUTHENTICATION_FAILED で断り、発行しないこと", async () => {
    await using server = await createTestClient();
    const { passkey } = await signInAsAdmin(server);
    const assertion = await answerReauthentication(server, passkey);
    const other = await createFakeAuthenticator();

    await server.client.admin.deployTokens.issue({ name: "1", assertion });

    expect(
      await catchErrorCode(
        server.client.admin.deployTokens.issue({ name: "2", assertion }),
      ),
    ).toBe("REAUTHENTICATION_FAILED");
    expect(
      await catchErrorCode(
        server.client.admin.deployTokens.issue({
          name: "3",
          assertion: await answerReauthentication(server, {
            ...passkey,
            authenticator: other,
          }),
        }),
      ),
    ).toBe("REAUTHENTICATION_FAILED");
    expect(
      (await server.client.admin.deployTokens.list()).tokens.map(
        ({ name }) => name,
      ),
    ).toEqual(["1"]);
  });
});

describe("デプロイ用のトークンの最後に使った日時", () => {
  test("前に使った日時より古い時刻では、戻さないこと", async () => {
    let now = TEST_NOW;
    await using server = await createTestClient({ clock: { now: () => now } });
    const { passkey } = await signInAsAdmin(server);
    const token = await issueTestDeployToken(server, passkey);
    const later = new Date(TEST_NOW.getTime() + 60_000);

    now = later;
    await server.internal(token).deploy.kinds.push({ kinds: [] });
    now = TEST_NOW;
    await server.internal(token).deploy.kinds.push({ kinds: [] });

    expect(
      (await server.client.admin.deployTokens.list()).tokens[0]?.lastUsedAt,
    ).toBe(later.toISOString());
  });
});

describe("デプロイ用のトークンの取り消し", () => {
  test("取り消したトークンでは、定義を送れなくなること", async () => {
    await using server = await createTestClient();

    const { passkey } = await signInAsAdmin(server);
    const token = await issueTestDeployToken(server, passkey);
    const other = await issueTestDeployToken(server, passkey);
    const id = token.split(".")[0] ?? "";

    expect(await pushNothing(token, server)).toBe(SUCCEEDED);

    await server.client.admin.deployTokens.revoke({ id });

    expect(await pushNothing(token, server)).toBe("UNAUTHORIZED");
    expect(await pushNothing(other, server)).toBe(SUCCEEDED);
    expect(
      await catchErrorCode(server.client.admin.deployTokens.revoke({ id })),
    ).toBe("NOT_FOUND");
  });
});

describe("デプロイ用 API の入口", () => {
  test("1つ以上あること", () => {
    expect(deployPaths.length).toBeGreaterThan(0);
  });

  test.each(deployPaths)(
    "%s は、トークンが無いか、違うか、形が崩れていると、401 と UNAUTHORIZED を返し、キャッシュさせないこと",
    async (path) => {
      await using server = await createTestClient();

      const { passkey } = await signInAsAdmin(server);
      const token = await issueTestDeployToken(server, passkey);
      const [id = ""] = token.split(".");

      for (const authorization of [
        undefined,
        "",
        `Basic ${token}`,
        `Bearer ${id}.${"A".repeat(43)}`,
        `Bearer ${"A".repeat(22)}.${"A".repeat(43)}`,
        "Bearer broken",
      ]) {
        const response = await server.internalApp.fetch(
          new Request(`${TEST_INTERNAL_URL}/api/${path}`, {
            method: "POST",
            headers:
              authorization === undefined
                ? { "content-type": "application/json" }
                : { "content-type": "application/json", authorization },
            body: JSON.stringify({ json: null }),
          }),
        );

        const body: unknown = await response.json();

        expect(response.status).toBe(401);
        expect(body).toMatchObject({ json: { code: "UNAUTHORIZED" } });
        expect(response.headers.get("cache-control")).toBe("no-store");
        expect(response.headers.get("www-authenticate")).toBe("Bearer");
      }
    },
  );

  test("断ったときは、token の secret を書かずに、ログに残すこと", async () => {
    await using server = await createTestClient();
    const secret = "S".repeat(43);

    expect(await pushNothing(`${"A".repeat(22)}.${secret}`, server)).toBe(
      "UNAUTHORIZED",
    );
    expect(
      server.logs.map(({ details, level, message }) => ({
        level,
        message,
        details,
      })),
    ).toEqual([
      {
        level: "warn",
        message: "デプロイ用のトークンを確かめられなかった",
        details: { deployTokenId: "A".repeat(22) },
      },
    ]);
    expect(JSON.stringify(server.logs)).not.toContain(secret);
  });

  test("セッションの Cookie では、定義を送れないこと", async () => {
    await using server = await createTestClient();
    const { browser } = await signInAsAdmin(server);

    const response = await server.internalApp.fetch(
      new Request(`${TEST_INTERNAL_URL}/api/deploy/kinds/push`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie: browser.cookie(),
        },
        body: JSON.stringify({ json: { kinds: [] } }),
      }),
    );

    expect(response.status).toBe(401);
  });
});
