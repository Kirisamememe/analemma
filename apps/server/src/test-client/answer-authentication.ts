import type {
  InferContractRouterInputs,
  InferContractRouterOutputs,
} from "@orpc/contract";

import type { contract } from "@analemma/contract";

import {
  type FakeAuthenticationInput,
  createFakeAuthentication,
} from "@/features/auth/webauthn/fake-authenticator/create-fake-authentication";
import {
  TEST_ORIGIN,
  type TestBrowser,
} from "@/test-client/create-test-client";
import type { TestPasskey } from "@/test-client/sign-in-as-admin";

/** ログインの資格情報の入力。 */
export type AuthenticationCredentialJson = InferContractRouterInputs<
  typeof contract
>["auth"]["login"]["verify"];

/** テスト用の認証器で答える、ログインの options と、壊すときの値。 */
export type AuthenticationAnswer = {
  /** 登録したパスキー。 */
  readonly passkey: TestPasskey;
  /** server が返したログインの options。 */
  readonly options: InferContractRouterOutputs<
    typeof contract
  >["auth"]["login"]["options"];
  /** 正しい応答から変える値。 */
  readonly broken?: Partial<FakeAuthenticationInput>;
};

const toBase64url = (bytes: Uint8Array): string =>
  bytes.toBase64({ alphabet: "base64url", omitPadding: true });

/** テストのために、テスト用の認証器でログインの options に答え、contract の形の資格情報を作る。 */
export const answerAuthentication = async ({
  broken = {},
  options,
  passkey,
}: AuthenticationAnswer): Promise<AuthenticationCredentialJson> => {
  const response = await createFakeAuthentication({
    authenticator: passkey.authenticator,
    challenge: Uint8Array.fromBase64(options.challenge, {
      alphabet: "base64url",
    }),
    origin: TEST_ORIGIN,
    rpId: options.rpId,
    ...broken,
  });

  return {
    id: toBase64url(passkey.authenticator.credentialId),
    type: "public-key",
    response: {
      clientDataJSON: toBase64url(response.clientDataJSON),
      authenticatorData: toBase64url(response.authenticatorData),
      signature: toBase64url(response.signature),
      userHandle: passkey.userHandle,
    },
  };
};

/** テストのために、ブラウザで再認証の options を取り、パスキーで答える。 */
export const answerReauthentication = async (
  browser: TestBrowser,
  passkey: TestPasskey,
): Promise<AuthenticationCredentialJson> =>
  answerAuthentication({
    passkey,
    options: await browser.client.admin.session.reauthenticationOptions(),
  });
