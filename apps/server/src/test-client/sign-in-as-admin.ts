import {
  type FakeAuthenticator,
  createFakeAuthenticator,
} from "@/features/auth/webauthn/fake-authenticator/create-fake-authenticator";
import { answerAuthentication } from "@/test-client/answer-authentication";
import { answerRegistration } from "@/test-client/answer-registration";
import type { TestBrowser, TestClient } from "@/test-client/create-test-client";

/** テストで登録した、テスト用の認証器のパスキー。 */
export type TestPasskey = {
  /** 鍵を持つテスト用の認証器。 */
  readonly authenticator: FakeAuthenticator;
  /** 認証器が覚えた、管理者の user handle の base64url。 */
  readonly userHandle: string;
};

/** 登録用 URL でパスキーを登録してログインした、テストのブラウザ。 */
export type SignedInAdmin = {
  /** 登録したパスキー。 */
  readonly passkey: TestPasskey;
  /** ログインしたブラウザ。 */
  readonly browser: TestBrowser;
};

/** テストのために、登録用 URL からテスト用の認証器のパスキーを登録して、ログインする。 */
export const signInAsAdmin = async (
  server: TestClient,
  browser: TestBrowser = server,
): Promise<SignedInAdmin> => {
  const token = new URL(await server.issueEnrollmentUrl()).hash.slice(1);
  const options = await browser.client.auth.enrollment.options({ token });
  const authenticator = await createFakeAuthenticator();

  await browser.client.auth.enrollment.register({
    token,
    name: "最初のパスキー",
    credential: await answerRegistration({ authenticator, options }),
  });

  return { passkey: { authenticator, userHandle: options.user.id }, browser };
};

/** テストのために、登録したパスキーでログインする。 */
export const logInWithPasskey = async (
  browser: TestBrowser,
  passkey: TestPasskey,
): Promise<void> => {
  const options = await browser.client.auth.login.options();

  await browser.client.auth.login.verify(
    await answerAuthentication({ passkey, options }),
  );
};
