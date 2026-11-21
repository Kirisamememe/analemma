import type { InferContractRouterInputs } from "@orpc/contract";

import type { contract } from "@analemma/contract";

import type { AuthenticationResponse } from "../webauthn/verify-authentication";

/** ログインの資格情報の入力。 */
export type AuthenticationCredentialInput = InferContractRouterInputs<
  typeof contract
>["auth"]["login"]["verify"];

/** バイト列に戻したログインの資格情報。 */
export type DecodedAuthenticationCredential = {
  /** 資格情報の ID を、base64url の正規形に直したもの。 */
  readonly id: string;
  /** 認証器が返した user handle。 */
  readonly userHandle: Uint8Array<ArrayBuffer>;
  /** 検証に渡す、clientDataJSON・authenticatorData・署名。 */
  readonly response: AuthenticationResponse;
};

const fromBase64url = (text: string): Uint8Array<ArrayBuffer> =>
  Uint8Array.fromBase64(text, { alphabet: "base64url" });

/** ログインの資格情報の base64url を、バイト列と正規形の ID に戻す。 */
export const decodeAuthenticationCredential = ({
  id,
  response,
}: AuthenticationCredentialInput): DecodedAuthenticationCredential => ({
  id: fromBase64url(id).toBase64({ alphabet: "base64url", omitPadding: true }),
  userHandle: fromBase64url(response.userHandle),
  response: {
    clientDataJSON: fromBase64url(response.clientDataJSON),
    authenticatorData: fromBase64url(response.authenticatorData),
    signature: fromBase64url(response.signature),
  },
});
