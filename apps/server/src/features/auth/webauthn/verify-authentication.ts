import { parseAuthenticatorData } from "./authenticator-data/parse-authenticator-data";
import {
  type AuthenticatorExpectation,
  verifyAuthenticatorFlags,
} from "./authenticator-data/verify-authenticator-flags";
import { verifyClientData } from "./client-data/verify-client-data";
import { importCoseKey } from "./cose-key/import-cose-key";
import { type WebAuthnRejection, reject } from "./rejection";

/** ログインで届く、ブラウザの `AuthenticatorAssertionResponse` の中身。 */
export type AuthenticationResponse = {
  /** ブラウザが作った clientDataJSON。 */
  readonly clientDataJSON: Uint8Array<ArrayBuffer>;
  /** 認証器が作った authenticatorData。 */
  readonly authenticatorData: Uint8Array<ArrayBuffer>;
  /** 認証器の署名。 */
  readonly signature: Uint8Array<ArrayBuffer>;
};

/** ログインの検証で照らし合わせる値。 */
export type AuthenticationExpectation = AuthenticatorExpectation & {
  /** server が出した challenge。 */
  readonly challenge: Uint8Array;
  /** 管理画面の origin。 */
  readonly origin: string;
  /** 登録で受け取った COSE_Key の公開鍵。 */
  readonly publicKey: Uint8Array<ArrayBuffer>;
  /** 登録で受け取った COSE のアルゴリズムの番号。 */
  readonly algorithm: number;
  /** 最後に受け取った `signCount`。 */
  readonly signCount: number;
  /** 登録で受け取った BE。 */
  readonly backupEligible: boolean;
};

/** 検証できたログイン。 */
export type VerifiedAuthentication = {
  /** 結果の種類。 */
  readonly _tag: "Verified";
  /** 届いた `signCount`。 */
  readonly signCount: number;
  /** BS:今、同期されているか。 */
  readonly backedUp: boolean;
  /** `signCount` が、保存した値から戻ったか。 */
  readonly counterWentBack: boolean;
  /** BE が、登録したときと変わったか。 */
  readonly backupEligibilityChanged: boolean;
};

/** ログインの応答を、保存した公開鍵で仕様の手順どおりに検証する。 */
export const verifyAuthentication = async (
  response: AuthenticationResponse,
  expected: AuthenticationExpectation,
): Promise<VerifiedAuthentication | WebAuthnRejection> => {
  const clientData = verifyClientData(response.clientDataJSON, {
    type: "webauthn.get",
    challenge: expected.challenge,
    origin: expected.origin,
  });

  if (clientData._tag === "Rejected") {
    return clientData;
  }

  const authenticatorData = parseAuthenticatorData(response.authenticatorData);

  if (authenticatorData._tag === "Rejected") {
    return authenticatorData;
  }

  const flags = await verifyAuthenticatorFlags(authenticatorData, expected);

  if (flags._tag === "Rejected") {
    return flags;
  }

  if (authenticatorData.attestedCredential !== undefined) {
    return reject("ログイン: AT が立っている(資格情報が入っている)");
  }

  const key = await importCoseKey(expected.publicKey);

  if (key._tag === "Rejected" || key.algorithm !== expected.algorithm) {
    throw new Error("保存した公開鍵を読めないか、保存したアルゴリズムと違う");
  }

  const clientDataHash = new Uint8Array(
    await crypto.subtle.digest("SHA-256", response.clientDataJSON),
  );
  const signature = await key.verify(
    response.signature,
    new Uint8Array([...response.authenticatorData, ...clientDataHash]),
  );

  if (signature._tag === "Rejected") {
    return signature;
  }

  const { signCount } = authenticatorData;

  return {
    _tag: "Verified",
    signCount,
    backedUp: authenticatorData.flags.backedUp,
    counterWentBack:
      (signCount !== 0 || expected.signCount !== 0) &&
      signCount <= expected.signCount,
    backupEligibilityChanged:
      authenticatorData.flags.backupEligible !== expected.backupEligible,
  };
};
