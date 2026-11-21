import type { InferContractRouterInputs } from "@orpc/contract";

import type { contract } from "@analemma/contract";

import type { RegistrationResponse } from "../webauthn/verify-registration";
import { keepKnownTransports } from "./keep-known-transports";

/** 登録の資格情報の入力。 */
export type RegistrationCredentialInput = InferContractRouterInputs<
  typeof contract
>["auth"]["enrollment"]["register"]["credential"];

/** バイト列に戻した登録の資格情報。 */
export type DecodedRegistrationCredential = {
  /** 資格情報の ID を、base64url の正規形に直したもの。 */
  readonly id: string;
  /** 検証に渡す、clientDataJSON と attestationObject。 */
  readonly response: RegistrationResponse;
  /** 仕様にある値だけを残した transports。 */
  readonly transports: readonly string[];
};

const fromBase64url = (text: string): Uint8Array<ArrayBuffer> =>
  Uint8Array.fromBase64(text, { alphabet: "base64url" });

/** 登録の資格情報の base64url を、バイト列と正規形の ID に戻す。 */
export const decodeRegistrationCredential = ({
  id,
  response,
}: RegistrationCredentialInput): DecodedRegistrationCredential => ({
  id: fromBase64url(id).toBase64({ alphabet: "base64url", omitPadding: true }),
  response: {
    clientDataJSON: fromBase64url(response.clientDataJSON),
    attestationObject: fromBase64url(response.attestationObject),
  },
  transports: keepKnownTransports(response.transports),
});
