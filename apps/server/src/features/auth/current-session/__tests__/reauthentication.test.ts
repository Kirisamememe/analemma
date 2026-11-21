import { describe, expect, test } from "bun:test";

import {
  addTestPasskey,
  passkeyIdOf,
} from "../../../../test-client/add-test-passkey";
import {
  type AuthenticationCredentialJson,
  answerAuthentication,
  answerReauthentication,
} from "../../../../test-client/answer-authentication";
import { answerRegistration } from "../../../../test-client/answer-registration";
import {
  SUCCEEDED,
  catchErrorCode,
} from "../../../../test-client/catch-error-code";
import {
  TEST_RP_ID,
  type TestBrowser,
  createTestClient,
} from "../../../../test-client/create-test-client";
import {
  type TestPasskey,
  logInWithPasskey,
  signInAsAdmin,
} from "../../../../test-client/sign-in-as-admin";
import { createFakeAuthenticator } from "../../webauthn/fake-authenticator/create-fake-authenticator";

/** 再認証を求める操作の対象。 */
type Target = {
  /** 操作を呼ぶブラウザ。 */
  readonly browser: TestBrowser;
  /** 消す対象のパスキー。 */
  readonly passkey: TestPasskey;
};

/** 再認証を求める操作。 */
type Action = {
  /** テストの名前に入れる、操作の名前。 */
  readonly title: string;
  /** 届ける資格情報で、操作を呼ぶ。 */
  readonly run: (
    target: Target,
    assertion: AuthenticationCredentialJson,
  ) => Promise<unknown>;
};

const ACTIONS: readonly Action[] = [
  {
    title: "パスキーの追加",
    run: async ({ browser }, assertion) =>
      browser.client.admin.passkeys.register({
        name: "足すパスキー",
        credential: await answerRegistration({
          authenticator: await createFakeAuthenticator(),
          options: await browser.client.admin.passkeys.registrationOptions(),
        }),
        assertion,
      }),
  },
  {
    title: "パスキーの削除",
    run: async ({ browser, passkey }, assertion) =>
      browser.client.admin.passkeys.delete({
        id: passkeyIdOf(passkey),
        assertion,
      }),
  },
];

describe("再認証の options", () => {
  test("RP ID と、UV を求める discoverable な options を返すこと", async () => {
    await using server = await createTestClient();

    await signInAsAdmin(server);

    const options = await server.client.admin.session.reauthenticationOptions();

    expect(options).toEqual({
      challenge: options.challenge,
      rpId: TEST_RP_ID,
      allowCredentials: [],
      userVerification: "required",
      timeout: 5 * 60 * 1000,
    });
  });

  test("ログインしていなければ UNAUTHORIZED で断ること", async () => {
    await using server = await createTestClient();

    expect(
      await catchErrorCode(
        server.client.admin.session.reauthenticationOptions(),
      ),
    ).toBe("UNAUTHORIZED");
  });
});

describe.each(ACTIONS)("$title の前の再認証", ({ run }) => {
  test("セッションの Cookie だけでは、確かめ直せずに断ること", async () => {
    await using server = await createTestClient();
    const { passkey } = await signInAsAdmin(server);
    const second = await addTestPasskey(server, {
      name: "2つめ",
      current: passkey,
    });
    const laptop = server.openBrowser();

    await logInWithPasskey(laptop, passkey);

    const thief = server.openBrowser(server.cookie());
    const attempt = async (
      assertion: AuthenticationCredentialJson,
    ): Promise<string> =>
      catchErrorCode(run({ browser: thief, passkey: second }, assertion));
    const reauthenticationOptions = async () =>
      thief.client.admin.session.reauthenticationOptions();

    expect(
      await attempt(
        await answerReauthentication(thief, {
          ...passkey,
          authenticator: await createFakeAuthenticator(),
        }),
      ),
    ).toBe("REAUTHENTICATION_FAILED");
    expect(
      await attempt(
        await answerAuthentication({
          passkey: {
            ...passkey,
            authenticator: {
              ...(await createFakeAuthenticator()),
              credentialId: passkey.authenticator.credentialId,
            },
          },
          options: await reauthenticationOptions(),
        }),
      ),
    ).toBe("REAUTHENTICATION_FAILED");
    expect(
      await attempt(
        await answerAuthentication({
          passkey,
          options: await thief.client.auth.login.options(),
        }),
      ),
    ).toBe("REAUTHENTICATION_FAILED");
    expect(await attempt(await answerReauthentication(laptop, passkey))).toBe(
      "REAUTHENTICATION_FAILED",
    );
    expect((await server.client.admin.passkeys.list()).passkeys).toHaveLength(
      2,
    );
    expect(await catchErrorCode(laptop.client.admin.session.get())).toBe(
      SUCCEEDED,
    );
    expect(server.logs.map((entry) => entry.message)).toContain(
      "再認証を断った",
    );
  });

  test("同じ再認証の資格情報を、2回は使えないこと", async () => {
    await using server = await createTestClient();
    const { passkey } = await signInAsAdmin(server);
    const second = await addTestPasskey(server, {
      name: "2つめ",
      current: passkey,
    });
    const third = await addTestPasskey(server, {
      name: "3つめ",
      current: passkey,
    });
    const assertion = await answerReauthentication(server, passkey);

    expect(
      await catchErrorCode(
        run({ browser: server, passkey: second }, assertion),
      ),
    ).toBe(SUCCEEDED);
    expect(
      await catchErrorCode(run({ browser: server, passkey: third }, assertion)),
    ).toBe("REAUTHENTICATION_FAILED");
  });

  test("形の誤った資格情報を、入力の誤りとして断ること", async () => {
    await using server = await createTestClient();
    const { passkey } = await signInAsAdmin(server);
    const assertion = await answerReauthentication(server, passkey);

    expect(
      await catchErrorCode(
        run(
          { browser: server, passkey },
          { ...assertion, response: { ...assertion.response, signature: "" } },
        ),
      ),
    ).toBe("BAD_REQUEST");
  });
});
