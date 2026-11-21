import { COSE_ALGORITHM } from "../cose-key/cose-algorithm";
import type { AuthenticationResponse } from "../verify-authentication";
import {
  AUTHENTICATOR_FLAG,
  buildAuthenticatorData,
  hashRpId,
} from "./build-authenticator-data";
import { buildClientDataJson } from "./build-client-data-json";
import { convertToDerSignature } from "./convert-to-der-signature";
import type { FakeAuthenticator } from "./create-fake-authenticator";
import { SIGN_PARAMS } from "./generate-test-key-pair";

/** ログインの応答の作り方。 */
export type FakeAuthenticationInput = {
  /** 応答を作る認証器。 */
  readonly authenticator: FakeAuthenticator;
  /** server が出した challenge。 */
  readonly challenge: Uint8Array;
  /** ページの origin。 */
  readonly origin: string;
  /** 認証器がハッシュにする RP ID。 */
  readonly rpId: string;
  /** clientDataJSON の type。 */
  readonly type?: string;
  /** authenticatorData の flags。 */
  readonly flags?: number;
  /** `signCount`。 */
  readonly signCount?: number;
  /** authenticatorData に資格情報を入れるか。 */
  readonly withCredential?: boolean;
  /** clientDataJSON の先頭に BOM を付けるか。 */
  readonly withBom?: boolean;
};

const F = AUTHENTICATOR_FLAG;

/** テストのために、テスト用の認証器でログインの応答を作って署名する。 */
export const createFakeAuthentication = async ({
  authenticator,
  challenge,
  flags = F.UP | F.UV | F.BE | F.BS,
  origin,
  rpId,
  signCount = 0,
  type = "webauthn.get",
  withBom = false,
  withCredential = false,
}: FakeAuthenticationInput): Promise<AuthenticationResponse> => {
  const json = buildClientDataJson({ type, challenge, origin });
  const clientDataJSON = withBom
    ? new Uint8Array([0xef, 0xbb, 0xbf, ...json])
    : json;
  const authenticatorData = buildAuthenticatorData({
    rpIdHash: await hashRpId(rpId),
    flags,
    signCount,
    ...(withCredential ? { credential: authenticator } : {}),
  });
  const clientDataHash = new Uint8Array(
    await crypto.subtle.digest("SHA-256", clientDataJSON),
  );
  const signature = new Uint8Array(
    await crypto.subtle.sign(
      SIGN_PARAMS[authenticator.algorithm],
      authenticator.keyPair.privateKey,
      new Uint8Array([...authenticatorData, ...clientDataHash]),
    ),
  );

  return {
    clientDataJSON,
    authenticatorData,
    signature:
      authenticator.algorithm === COSE_ALGORITHM.ES256
        ? convertToDerSignature(signature)
        : signature,
  };
};
