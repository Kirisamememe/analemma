import { parseAuthenticatorData } from "@/features/auth/webauthn/authenticator-data/parse-authenticator-data";
import {
  type AuthenticatorExpectation,
  verifyAuthenticatorFlags,
} from "@/features/auth/webauthn/authenticator-data/verify-authenticator-flags";
import {
  decodeCbor,
  isCborMap,
} from "@/features/auth/webauthn/cbor/decode-cbor";
import { verifyClientData } from "@/features/auth/webauthn/client-data/verify-client-data";
import type { CoseAlgorithm } from "@/features/auth/webauthn/cose-key/cose-algorithm";
import { importCoseKey } from "@/features/auth/webauthn/cose-key/import-cose-key";
import {
  type WebAuthnRejection,
  reject,
} from "@/features/auth/webauthn/rejection";

/** 登録で届く、ブラウザの `AuthenticatorAttestationResponse` の中身。 */
export type RegistrationResponse = {
  /** ブラウザが作った clientDataJSON。 */
  readonly clientDataJSON: Uint8Array<ArrayBuffer>;
  /** 認証器が作った attestationObject。 */
  readonly attestationObject: Uint8Array<ArrayBuffer>;
};

/** 登録の検証で照らし合わせる値。 */
export type RegistrationExpectation = AuthenticatorExpectation & {
  /** server が出した challenge。 */
  readonly challenge: Uint8Array;
  /** 管理画面の origin。 */
  readonly origin: string;
  /** 登録の options に並べた COSE のアルゴリズム。 */
  readonly algorithms: readonly CoseAlgorithm[];
};

/** 検証できた資格情報。 */
export type VerifiedRegistration = {
  /** どの結果か。 */
  readonly _tag: "Verified";
  /** 資格情報の ID。 */
  readonly credentialId: Uint8Array<ArrayBuffer>;
  /** COSE_Key の CBOR のままの公開鍵。 */
  readonly publicKey: Uint8Array<ArrayBuffer>;
  /** COSE のアルゴリズムの番号。 */
  readonly algorithm: CoseAlgorithm;
  /** `signCount`。 */
  readonly signCount: number;
  /** 認証器の機種を表す 16 バイト。 */
  readonly aaguid: Uint8Array<ArrayBuffer>;
  /** BE:ほかの端末へ同期されうるパスキーか。 */
  readonly backupEligible: boolean;
  /** BS:今、同期されているか。 */
  readonly backedUp: boolean;
};

const CREDENTIAL_ID_LENGTH = { min: 16, max: 1023 } as const;

const invalid = (problem: string): WebAuthnRejection =>
  reject(`登録: ${problem}`);

const readAuthData = (
  attestationObject: Uint8Array<ArrayBuffer>,
): Uint8Array<ArrayBuffer> | WebAuthnRejection => {
  const decoded = decodeCbor(attestationObject);

  if (decoded._tag === "Rejected") {
    return decoded;
  }

  if (decoded.end !== attestationObject.length) {
    return invalid("attestationObject の末尾に余りがある");
  }

  if (!isCborMap(decoded.value)) {
    return invalid("attestationObject が CBOR の map でない");
  }

  const fmt = decoded.value.get("fmt");
  const attStmt = decoded.value.get("attStmt");
  const authData = decoded.value.get("authData");

  if (typeof fmt !== "string") {
    return invalid("attestationObject の fmt が文字列でない");
  }

  if (attStmt === undefined || !isCborMap(attStmt)) {
    return invalid("attestationObject の attStmt が CBOR の map でない");
  }

  if (fmt === "none" && attStmt.size > 0) {
    return invalid("fmt が none なのに、attStmt が空でない");
  }

  return authData instanceof Uint8Array
    ? authData
    : invalid("attestationObject に authData が無い");
};

/** 登録の応答を、attestation を見ない仕様の手順で検証する。 */
export const verifyRegistration = async (
  response: RegistrationResponse,
  expected: RegistrationExpectation,
): Promise<VerifiedRegistration | WebAuthnRejection> => {
  const clientData = verifyClientData(response.clientDataJSON, {
    type: "webauthn.create",
    challenge: expected.challenge,
    origin: expected.origin,
  });

  if (clientData._tag === "Rejected") {
    return clientData;
  }

  const authData = readAuthData(response.attestationObject);

  if (!(authData instanceof Uint8Array)) {
    return authData;
  }

  const authenticatorData = parseAuthenticatorData(authData);

  if (authenticatorData._tag === "Rejected") {
    return authenticatorData;
  }

  const flags = await verifyAuthenticatorFlags(authenticatorData, expected);

  if (flags._tag === "Rejected") {
    return flags;
  }

  const credential = authenticatorData.attestedCredential;

  if (credential === undefined) {
    return invalid("AT が立っていない(資格情報が無い)");
  }

  if (credential.credentialId.length < CREDENTIAL_ID_LENGTH.min) {
    return invalid("資格情報の ID が 16 バイトより短い");
  }

  if (credential.credentialId.length > CREDENTIAL_ID_LENGTH.max) {
    return invalid("資格情報の ID が 1023 バイトより長い");
  }

  const key = await importCoseKey(credential.publicKey);

  if (key._tag === "Rejected") {
    return key;
  }

  if (!expected.algorithms.includes(key.algorithm)) {
    return invalid(
      `options に並べていないアルゴリズム(${String(key.algorithm)})`,
    );
  }

  return {
    _tag: "Verified",
    credentialId: credential.credentialId,
    publicKey: credential.publicKey,
    algorithm: key.algorithm,
    signCount: authenticatorData.signCount,
    aaguid: credential.aaguid,
    backupEligible: authenticatorData.flags.backupEligible,
    backedUp: authenticatorData.flags.backedUp,
  };
};
