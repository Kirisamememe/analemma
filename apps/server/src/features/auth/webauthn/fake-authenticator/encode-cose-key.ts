import {
  COSE_ALGORITHM,
  type CoseAlgorithm,
} from "@/features/auth/webauthn/cose-key/cose-algorithm";
import {
  type CborInput,
  encodeCbor,
} from "@/features/auth/webauthn/fake-authenticator/encode-cbor";

const fromBase64url = (text: string | undefined): Uint8Array =>
  Uint8Array.fromBase64(text ?? "", { alphabet: "base64url" });

/** WebCrypto が書き出した JWK のうち、COSE_Key に写す値。 */
type ExportedJwk = {
  /** 曲線の上の点の x 座標。 */
  readonly x?: string;
  /** 曲線の上の点の y 座標。 */
  readonly y?: string;
  /** RSA の法。 */
  readonly n?: string;
  /** RSA の公開指数。 */
  readonly e?: string;
}; // TODO: tsrs が読めたら標準の型に戻す

const toCoseEntries = (
  jwk: ExportedJwk,
  algorithm: CoseAlgorithm,
): [number, CborInput][] => {
  switch (algorithm) {
    case COSE_ALGORITHM.ES256: {
      return [
        [1, 2],
        [3, algorithm],
        [-1, 1],
        [-2, fromBase64url(jwk.x)],
        [-3, fromBase64url(jwk.y)],
      ];
    }
    case COSE_ALGORITHM.EdDSA: {
      return [
        [1, 1],
        [3, algorithm],
        [-1, 6],
        [-2, fromBase64url(jwk.x)],
      ];
    }
    case COSE_ALGORITHM.RS256: {
      return [
        [1, 3],
        [3, algorithm],
        [-1, fromBase64url(jwk.n)],
        [-2, fromBase64url(jwk.e)],
      ];
    }
  }
};

/** テストのために、WebCrypto の公開鍵を COSE_Key の CBOR に書き出す。 */
export const encodeCoseKey = async (
  publicKey: CryptoKey,
  algorithm: CoseAlgorithm,
): Promise<Uint8Array<ArrayBuffer>> => {
  const jwk: ExportedJwk = await crypto.subtle.exportKey("jwk", publicKey);

  return encodeCbor(new Map(toCoseEntries(jwk, algorithm)));
};
