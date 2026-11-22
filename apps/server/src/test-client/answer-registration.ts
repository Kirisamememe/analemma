import type {
  InferContractRouterInputs,
  InferContractRouterOutputs,
} from "@orpc/contract";

import type { contract } from "@analemma/contract";

import type { FakeAuthenticator } from "@/features/auth/webauthn/fake-authenticator/create-fake-authenticator";
import {
  type FakeRegistrationInput,
  createFakeRegistration,
} from "@/features/auth/webauthn/fake-authenticator/create-fake-registration";
import { TEST_ORIGIN } from "@/test-client/create-test-client";

/** 登録の資格情報の入力。 */
export type RegistrationCredentialJson = InferContractRouterInputs<
  typeof contract
>["auth"]["enrollment"]["register"]["credential"];

/** テスト用の認証器で答える、登録の options と、壊すときの値。 */
export type RegistrationAnswer = {
  /** 応答を作る認証器。 */
  readonly authenticator: FakeAuthenticator;
  /** server が返した登録の options。 */
  readonly options: InferContractRouterOutputs<
    typeof contract
  >["auth"]["enrollment"]["options"];
  /** 正しい応答から変える値。 */
  readonly broken?: Partial<FakeRegistrationInput>;
  /** 認証器が申告する transports。 */
  readonly transports?: readonly string[];
};

const toBase64url = (bytes: Uint8Array): string =>
  bytes.toBase64({ alphabet: "base64url", omitPadding: true });

/** テストのために、テスト用の認証器で登録の options に答え、contract の形の資格情報を作る。 */
export const answerRegistration = async ({
  authenticator,
  broken = {},
  options,
  transports = ["internal"],
}: RegistrationAnswer): Promise<RegistrationCredentialJson> => {
  const response = await createFakeRegistration({
    authenticator,
    challenge: Uint8Array.fromBase64(options.challenge, {
      alphabet: "base64url",
    }),
    origin: TEST_ORIGIN,
    rpId: options.rp.id,
    ...broken,
  });

  return {
    id: toBase64url(authenticator.credentialId),
    type: "public-key",
    response: {
      clientDataJSON: toBase64url(response.clientDataJSON),
      attestationObject: toBase64url(response.attestationObject),
      transports: [...transports],
    },
  };
};
