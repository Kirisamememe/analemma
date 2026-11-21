import { COSE_ALGORITHM, type CoseAlgorithm } from "../cose-key/cose-algorithm";

/** WebCrypto で鍵ペアを作るアルゴリズム。 */
type GenerateParams = {
  /** WebCrypto のアルゴリズムの名前。 */
  readonly name: string;
  /** ECDSA の曲線の名前。 */
  readonly namedCurve?: string;
  /** RSA の法のビット数。 */
  readonly modulusLength?: number;
  /** RSA の公開指数。 */
  readonly publicExponent?: Uint8Array<ArrayBuffer>;
  /** アルゴリズムが使うハッシュ。 */
  readonly hash?: string;
}; // TODO: tsrs が読めたら標準の型に戻す

/** WebCrypto で署名するアルゴリズム。 */
type SignParams = {
  /** WebCrypto のアルゴリズムの名前。 */
  readonly name: string;
  /** アルゴリズムが使うハッシュ。 */
  readonly hash?: string;
}; // TODO: tsrs が読めたら標準の型に戻す

const GENERATE_PARAMS: Readonly<Record<CoseAlgorithm, GenerateParams>> = {
  [COSE_ALGORITHM.ES256]: { name: "ECDSA", namedCurve: "P-256" },
  [COSE_ALGORITHM.EdDSA]: { name: "Ed25519" },
  [COSE_ALGORITHM.RS256]: {
    name: "RSASSA-PKCS1-v1_5",
    modulusLength: 2048,
    publicExponent: new Uint8Array([1, 0, 1]),
    hash: "SHA-256",
  },
};

/** WebCrypto で署名に使うアルゴリズムごとの値。 */
export const SIGN_PARAMS: Readonly<Record<CoseAlgorithm, SignParams>> = {
  [COSE_ALGORITHM.ES256]: { name: "ECDSA", hash: "SHA-256" },
  [COSE_ALGORITHM.EdDSA]: { name: "Ed25519" },
  [COSE_ALGORITHM.RS256]: { name: "RSASSA-PKCS1-v1_5" },
};

/** テストのために、COSE のアルゴリズムの鍵ペアを作る。 */
export const generateTestKeyPair = async (
  algorithm: CoseAlgorithm,
): Promise<CryptoKeyPair> => {
  const pair = await crypto.subtle.generateKey(
    GENERATE_PARAMS[algorithm],
    true,
    ["sign", "verify"],
  );

  if (!("privateKey" in pair)) {
    throw new TypeError("鍵ペアができなかった");
  }

  return pair;
};
