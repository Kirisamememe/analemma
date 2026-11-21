import type { ApiInputs } from "../../../api/api-types";
import { toBase64Url } from "./base64url";

/** server に送る、ログインの資格情報。 */
export type AuthenticationCredential = ApiInputs["auth"]["login"]["verify"];

/** server に送る、登録の資格情報。 */
export type RegistrationCredential =
  ApiInputs["auth"]["enrollment"]["register"]["credential"];

/** 認証器が返した、ログインの応答。 */
export type Assertion = {
  /** 資格情報の ID の base64url。 */
  readonly id: string;
  /** 認証器の応答。 */
  readonly response: Pick<
    AuthenticatorAssertionResponse,
    "clientDataJSON" | "authenticatorData" | "signature" | "userHandle"
  >;
};

/** 認証器が返した、登録の応答。 */
export type Attestation = {
  /** 資格情報の ID の base64url。 */
  readonly id: string;
  /** 認証器の応答。 */
  readonly response: Pick<
    AuthenticatorAttestationResponse,
    "clientDataJSON" | "attestationObject" | "getTransports"
  >;
};

/** ログインの応答を、server に送る形にする。 */
export const toAuthenticationCredential = ({
  id,
  response,
}: Assertion): AuthenticationCredential => ({
  id,
  type: "public-key",
  response: {
    clientDataJSON: toBase64Url(response.clientDataJSON),
    authenticatorData: toBase64Url(response.authenticatorData),
    signature: toBase64Url(response.signature),
    userHandle:
      response.userHandle === null ? "" : toBase64Url(response.userHandle),
  },
});

/** 登録の応答を、server に送る形にする。 */
export const toRegistrationCredential = ({
  id,
  response,
}: Attestation): RegistrationCredential => ({
  id,
  type: "public-key",
  response: {
    clientDataJSON: toBase64Url(response.clientDataJSON),
    attestationObject: toBase64Url(response.attestationObject),
    transports: response.getTransports(),
  },
});
