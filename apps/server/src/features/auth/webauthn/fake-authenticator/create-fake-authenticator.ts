import { COSE_ALGORITHM, type CoseAlgorithm } from "../cose-key/cose-algorithm";
import { encodeCoseKey } from "./encode-cose-key";
import { generateTestKeyPair } from "./generate-test-key-pair";

/** テストで本物の認証器の代わりに鍵を持ち、応答に署名するもの。 */
export type FakeAuthenticator = {
  /** COSE のアルゴリズムの番号。 */
  readonly algorithm: CoseAlgorithm;
  /** 資格情報の ID。 */
  readonly credentialId: Uint8Array<ArrayBuffer>;
  /** 署名に使う鍵ペア。 */
  readonly keyPair: CryptoKeyPair;
  /** 公開鍵の COSE_Key。 */
  readonly publicKey: Uint8Array<ArrayBuffer>;
  /** 認証器の種類を表す 16 バイト。 */
  readonly aaguid: Uint8Array<ArrayBuffer>;
};

/** テスト用の認証器の作り方。 */
export type FakeAuthenticatorOptions = {
  /** COSE のアルゴリズムの番号。 */
  readonly algorithm?: CoseAlgorithm;
  /** 資格情報の ID のバイト数。 */
  readonly credentialIdLength?: number;
};

/** テストのために、鍵を持ったテスト用の認証器を作る。 */
export const createFakeAuthenticator = async ({
  algorithm = COSE_ALGORITHM.ES256,
  credentialIdLength = 16,
}: FakeAuthenticatorOptions = {}): Promise<FakeAuthenticator> => {
  const keyPair = await generateTestKeyPair(algorithm);

  return {
    algorithm,
    credentialId: crypto.getRandomValues(new Uint8Array(credentialIdLength)),
    keyPair,
    publicKey: await encodeCoseKey(keyPair.publicKey, algorithm),
    aaguid: new Uint8Array(16).fill(0xfa),
  };
};
