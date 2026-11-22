import { describe, expect, test } from "bun:test";

import { AUTHENTICATOR_FLAG } from "@/features/auth/webauthn/fake-authenticator/build-authenticator-data";
import type { FakeAuthenticationInput } from "@/features/auth/webauthn/fake-authenticator/create-fake-authentication";
import { createFakeAuthenticator } from "@/features/auth/webauthn/fake-authenticator/create-fake-authenticator";
import {
  answerAuthentication,
  type AuthenticationCredentialJson,
  SUCCEEDED,
  catchErrorCode,
  TEST_NOW,
  TEST_ORIGIN,
  TEST_RP_ID,
  type TestClient,
  createTestClient,
  type TestPasskey,
  signInAsAdmin,
} from "@/test-client";

/** テスト用の認証器で答えるパスキーと、壊すときの値。 */
type Answer = {
  /** 登録したパスキー。 */
  readonly passkey: TestPasskey;
  /** 正しい応答から変える値。 */
  readonly broken?: Partial<FakeAuthenticationInput>;
};

const answer = async (
  server: TestClient,
  { broken = {}, passkey }: Answer,
): Promise<AuthenticationCredentialJson> =>
  answerAuthentication({
    passkey,
    options: await server.client.auth.login.options(),
    broken,
  });

const messagesOf = (server: TestClient): string[] =>
  server.logs.map((entry) => entry.message);

const warningsOf = (server: TestClient): string[] =>
  server.logs
    .filter((entry) => entry.level === "warn")
    .map((entry) => entry.message);

describe("ログインの options", () => {
  test("RP ID と、UV を求める discoverable なログインの options を返すこと", async () => {
    await using server = await createTestClient();
    const options = await server.client.auth.login.options();

    expect(options).toEqual({
      challenge: options.challenge,
      rpId: TEST_RP_ID,
      allowCredentials: [],
      userVerification: "required",
      timeout: 5 * 60 * 1000,
    });
    expect(options.challenge).toMatch(/^[A-Za-z0-9_\-]{43}$/v);
  });
});

describe("パスキーでのログイン", () => {
  test("登録したパスキーでログインすると、セッションを始めて Cookie を書くこと", async () => {
    await using server = await createTestClient();
    const { passkey } = await signInAsAdmin(server);
    const browser = server.openBrowser();
    const options = await browser.client.auth.login.options();

    expect(
      await browser.client.auth.login.verify(
        await answerAuthentication({ passkey, options }),
      ),
    ).toEqual({
      expiresAt: new Date(
        TEST_NOW.getTime() + 7 * 24 * 60 * 60 * 1000,
      ).toISOString(),
    });
    expect(browser.cookie()).toMatch(
      /^__Host-analemma_session=[A-Za-z0-9_\-]{22}\.[A-Za-z0-9_\-]{43}$/v,
    );
    expect(await catchErrorCode(browser.client.admin.session.get())).toBe(
      SUCCEEDED,
    );
    expect(messagesOf(server)).toContain("ログインした");
  });

  test("同じ応答を送り直しても、challenge を使い切っているので断ること", async () => {
    await using server = await createTestClient();
    const { passkey } = await signInAsAdmin(server);
    const credential = await answer(server, { passkey });

    expect(
      await catchErrorCode(server.client.auth.login.verify(credential)),
    ).toBe(SUCCEEDED);
    expect(
      await catchErrorCode(server.client.auth.login.verify(credential)),
    ).toBe("CHALLENGE_EXPIRED");
  });

  test("5分たった challenge への応答を断ること", async () => {
    let now = TEST_NOW;
    await using server = await createTestClient({ clock: { now: () => now } });
    const { passkey } = await signInAsAdmin(server);
    const credential = await answer(server, { passkey });

    now = new Date(TEST_NOW.getTime() + 5 * 60 * 1000);

    expect(
      await catchErrorCode(server.client.auth.login.verify(credential)),
    ).toBe("CHALLENGE_EXPIRED");
  });

  test("登録用 URL の challenge で、ログインできないこと", async () => {
    await using server = await createTestClient();
    const { passkey } = await signInAsAdmin(server);
    const token = new URL(await server.issueEnrollmentUrl()).hash.slice(1);
    const enrollmentOptions = await server.client.auth.enrollment.options({
      token,
    });
    const credential = await answerAuthentication({
      passkey,
      options: {
        ...(await server.client.auth.login.options()),
        challenge: enrollmentOptions.challenge,
      },
    });

    expect(
      await catchErrorCode(server.client.auth.login.verify(credential)),
    ).toBe("CHALLENGE_EXPIRED");
  });

  test("登録していないパスキーを UNKNOWN_CREDENTIAL で断ること", async () => {
    await using server = await createTestClient();
    const { passkey } = await signInAsAdmin(server);
    const stranger = {
      ...passkey,
      authenticator: await createFakeAuthenticator(),
    };

    expect(
      await catchErrorCode(
        server.client.auth.login.verify(
          await answer(server, { passkey: stranger }),
        ),
      ),
    ).toBe("UNKNOWN_CREDENTIAL");
  });

  test("同じ資格情報の ID でも、別の鍵の署名を断ること", async () => {
    await using server = await createTestClient();
    const { passkey } = await signInAsAdmin(server);
    const forged = {
      ...passkey,
      authenticator: {
        ...(await createFakeAuthenticator()),
        credentialId: passkey.authenticator.credentialId,
      },
    };

    expect(
      await catchErrorCode(
        server.client.auth.login.verify(
          await answer(server, { passkey: forged }),
        ),
      ),
    ).toBe("INVALID_CREDENTIAL");
  });

  test("userHandle が管理者の user handle と違えば断ること", async () => {
    await using server = await createTestClient();
    const { passkey } = await signInAsAdmin(server);

    expect(
      await catchErrorCode(
        server.client.auth.login.verify(
          await answer(server, {
            passkey: { ...passkey, userHandle: "AAAAAAAAAAAAAAAAAAAAAA" },
          }),
        ),
      ),
    ).toBe("INVALID_CREDENTIAL");
  });

  test.each([
    { title: "違う origin の", broken: { origin: "https://evil.example" } },
    { title: "似た origin の", broken: { origin: `${TEST_ORIGIN}:8443` } },
    { title: "ほかの RP ID の", broken: { rpId: "evil.example" } },
    { title: "UV の無い", broken: { flags: 0x01 } },
    { title: "登録の type の", broken: { type: "webauthn.create" } },
  ])(
    "$title 応答を INVALID_CREDENTIAL で断り、Cookie を書かないこと",
    async ({ broken }) => {
      await using server = await createTestClient();
      const { passkey } = await signInAsAdmin(server);
      const browser = server.openBrowser();
      const credential = await answerAuthentication({
        passkey,
        options: await browser.client.auth.login.options(),
        broken,
      });

      expect(
        await catchErrorCode(browser.client.auth.login.verify(credential)),
      ).toBe("INVALID_CREDENTIAL");
      expect(browser.cookie()).toBe("");
      expect(messagesOf(server)).toContain("ログインを断った");
    },
  );

  test("signCount が戻っても、ログインさせて警告を残すこと", async () => {
    await using server = await createTestClient();
    const { passkey } = await signInAsAdmin(server);

    await server.client.auth.login.verify(
      await answer(server, { passkey, broken: { signCount: 5 } }),
    );

    expect(
      await catchErrorCode(
        server.client.auth.login.verify(
          await answer(server, { passkey, broken: { signCount: 3 } }),
        ),
      ),
    ).toBe(SUCCEEDED);
    expect(warningsOf(server)).toEqual(["パスキーの signCount が戻った"]);
  });

  test("BE が登録したときと違っても、ログインさせて警告を残すこと", async () => {
    await using server = await createTestClient();
    const { passkey } = await signInAsAdmin(server);

    expect(
      await catchErrorCode(
        server.client.auth.login.verify(
          await answer(server, {
            passkey,
            broken: { flags: AUTHENTICATOR_FLAG.UP | AUTHENTICATOR_FLAG.UV },
          }),
        ),
      ),
    ).toBe(SUCCEEDED);
    expect(warningsOf(server)).toEqual([
      "パスキーの BE が、登録したときと変わった",
    ]);
  });

  test("戻った signCount で、保存した signCount を下げないこと", async () => {
    await using server = await createTestClient();
    const { passkey } = await signInAsAdmin(server);

    for (const signCount of [5, 3, 4, 5, 6]) {
      await server.client.auth.login.verify(
        await answer(server, { passkey, broken: { signCount } }),
      );
    }

    expect(warningsOf(server)).toEqual([
      "パスキーの signCount が戻った",
      "パスキーの signCount が戻った",
      "パスキーの signCount が戻った",
    ]);
  });

  test("JSON として読めない clientDataJSON は、500 にしてログに残すこと", async () => {
    await using server = await createTestClient();
    const { passkey } = await signInAsAdmin(server);
    const credential = await answer(server, { passkey });

    expect(
      await catchErrorCode(
        server.client.auth.login.verify({
          ...credential,
          response: {
            ...credential.response,
            clientDataJSON: new TextEncoder()
              .encode("{")
              .toBase64({ alphabet: "base64url", omitPadding: true }),
          },
        }),
      ),
    ).toBe("INTERNAL_SERVER_ERROR");
    expect(
      server.logs
        .filter((entry) => entry.level === "error")
        .map((entry) => entry.message),
    ).toEqual(["API の処理で想定外の失敗が起きた"]);
  });

  test("userHandle の無い応答を、入力の誤りとして断ること", async () => {
    await using server = await createTestClient();
    const { passkey } = await signInAsAdmin(server);
    const credential = await answer(server, { passkey });

    expect(
      await catchErrorCode(
        server.client.auth.login.verify({
          ...credential,
          response: { ...credential.response, userHandle: "" },
        }),
      ),
    ).toBe("BAD_REQUEST");
  });
});
