import { createFakeAuthenticator } from "@/features/auth/webauthn/fake-authenticator/create-fake-authenticator";
import { answerReauthentication } from "@/test-client/passkeys/answer-authentication";
import { answerRegistration } from "@/test-client/passkeys/answer-registration";
import type { TestBrowser } from "@/test-client/create-test-client";
import type { TestPasskey } from "@/test-client/passkeys/sign-in-as-admin";

/** 足すパスキーの名前と、確かめ直すのに使う、今のパスキー。 */
export type TestPasskeyAddition = {
  /** 足すパスキーの名前。 */
  readonly name: string;
  /** 確かめ直すのに使う、登録済みのパスキー。 */
  readonly current: TestPasskey;
};

/** テストのために、ログインしたブラウザで、テスト用の認証器のパスキーを足す。 */
export const addTestPasskey = async (
  browser: TestBrowser,
  { current, name }: TestPasskeyAddition,
): Promise<TestPasskey> => {
  const assertion = await answerReauthentication(browser, current);
  const options = await browser.client.admin.passkeys.registrationOptions();
  const authenticator = await createFakeAuthenticator();

  await browser.client.admin.passkeys.register({
    name,
    credential: await answerRegistration({ authenticator, options }),
    assertion,
  });

  return { authenticator, userHandle: options.user.id };
};

/** テストのパスキーの、資格情報の ID の base64url を返す。 */
export const passkeyIdOf = ({ authenticator }: TestPasskey): string =>
  authenticator.credentialId.toBase64({
    alphabet: "base64url",
    omitPadding: true,
  });
