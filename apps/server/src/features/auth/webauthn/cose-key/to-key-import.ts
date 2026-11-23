import type { CborMap } from "@/features/auth/webauthn/cbor/decode-cbor";
import {
  COSE_ALGORITHM,
  type CoseAlgorithm,
} from "@/features/auth/webauthn/cose-key/cose-algorithm";
import { readDerSignature } from "@/features/auth/webauthn/cose-key/read-der-signature";
import {
  type WebAuthnRejection,
  reject,
} from "@/features/auth/webauthn/rejection";

/** JWK の形の公開鍵。 */
export type PublicJwk = {
  /** 鍵の型。 */
  readonly kty: "EC" | "OKP" | "RSA";
  /** 曲線の名前。 */
  readonly crv?: "P-256" | "Ed25519";
  /** 曲線の上の点の x 座標。 */
  readonly x?: string;
  /** 曲線の上の点の y 座標。 */
  readonly y?: string;
  /** RSA の法。 */
  readonly n?: string;
  /** RSA の公開指数。 */
  readonly e?: string;
}; // TODO: tsrs が読めたら標準の型に戻す

/** WebCrypto に渡す、鍵のアルゴリズム。 */
export type CryptoParams = {
  /** WebCrypto のアルゴリズムの名前。 */
  readonly name: "ECDSA" | "Ed25519" | "RSASSA-PKCS1-v1_5";
  /** ECDSA の曲線の名前。 */
  readonly namedCurve?: "P-256";
  /** アルゴリズムが使うハッシュ。 */
  readonly hash?: "SHA-256";
}; // TODO: tsrs が読めたら標準の型に戻す

/** COSE の鍵を、WebCrypto で読み込んで検証するための値。 */
export type KeyImport = {
  /** どの結果か。 */
  readonly _tag: "Readable";
  /** JWK の形の公開鍵。 */
  readonly jwk: PublicJwk;
  /** 鍵を読み込むアルゴリズム。 */
  readonly importParams: CryptoParams;
  /** 署名を検証するアルゴリズム。 */
  readonly verifyParams: CryptoParams;
  /** 認証器の署名を、WebCrypto が受け付ける形に直す。 */
  readonly readSignature: (
    signature: Uint8Array<ArrayBuffer>,
  ) => Uint8Array<ArrayBuffer> | WebAuthnRejection;
};

/** 鍵の値のバイト列か、受け付けない理由。 */
type KeyBytes = Uint8Array | WebAuthnRejection;

const KEY = { kty: 1, crv: -1, x: -2, y: -3, n: -1, e: -2 } as const;
const KEY_TYPE = { OKP: 1, EC2: 2, RSA: 3 } as const;

const PRIVATE_LABELS: Readonly<Record<number, readonly number[]>> = {
  [KEY_TYPE.OKP]: [-4],
  [KEY_TYPE.EC2]: [-4],
  [KEY_TYPE.RSA]: [-3, -4, -5, -6, -7, -8, -9, -10, -11, -12],
};

const CURVE = { P256: 1, Ed25519: 6 } as const;
const COORDINATE_LENGTH = 32;
const RSA_MODULUS_BITS = { min: 2048, max: 4096 } as const;
const RSA_EXPONENT_MAX_BITS = 33;
const RSA_EXPONENT_MIN = 3;

const invalid = (problem: string): WebAuthnRejection =>
  reject(`公開鍵: ${problem}`);

const toBase64url = (bytes: Uint8Array): string =>
  bytes.toBase64({ alphabet: "base64url", omitPadding: true });

const trimLeadingZeros = (bytes: Uint8Array): Uint8Array => {
  const start = bytes.findIndex((byte) => byte !== 0);

  return start === -1 ? bytes.subarray(bytes.length) : bytes.subarray(start);
};

const bitLength = (bytes: Uint8Array): number => {
  const trimmed = trimLeadingZeros(bytes);
  const [first = 0] = trimmed;

  return trimmed.length === 0
    ? 0
    : (trimmed.length - 1) * 8 + 32 - Math.clz32(first);
};

const bytesAt = (map: CborMap, key: number): KeyBytes => {
  const value = map.get(key);

  return value instanceof Uint8Array
    ? value
    : invalid(`鍵の値(${String(key)})がバイト列でない`);
};

const coordinateAt = (map: CborMap, key: number): KeyBytes => {
  const value = bytesAt(map, key);

  return value instanceof Uint8Array && value.length !== COORDINATE_LENGTH
    ? invalid(`鍵の値(${String(key)})の長さが 32 バイトでない`)
    : value;
};

const checkShape = (
  map: CborMap,
  [keyType, curve]: readonly [number, number | undefined],
): WebAuthnRejection | undefined => {
  if (map.get(KEY.kty) !== keyType) {
    return invalid("鍵の型(kty)がアルゴリズムに合わない");
  }

  if ((PRIVATE_LABELS[keyType] ?? []).some((label) => map.has(label))) {
    return invalid("秘密鍵の項目がある");
  }

  return curve === undefined || map.get(KEY.crv) === curve
    ? undefined
    : invalid("曲線(crv)がアルゴリズムに合わない");
};

const asIs = (signature: Uint8Array<ArrayBuffer>): Uint8Array<ArrayBuffer> =>
  signature;

const readEs256Signature = (
  signature: Uint8Array<ArrayBuffer>,
): Uint8Array<ArrayBuffer> | WebAuthnRejection => {
  const read = readDerSignature(signature);

  return read._tag === "Read" ? read.signature : read;
};

const toEs256 = (map: CborMap): KeyImport | WebAuthnRejection => {
  const problem = checkShape(map, [KEY_TYPE.EC2, CURVE.P256]);
  const x = coordinateAt(map, KEY.x);
  const y = coordinateAt(map, KEY.y);

  if (problem !== undefined) {
    return problem;
  }

  if (!(x instanceof Uint8Array)) {
    return x;
  }

  return y instanceof Uint8Array
    ? {
        _tag: "Readable",
        jwk: { kty: "EC", crv: "P-256", x: toBase64url(x), y: toBase64url(y) },
        importParams: { name: "ECDSA", namedCurve: "P-256" },
        verifyParams: { name: "ECDSA", hash: "SHA-256" },
        readSignature: readEs256Signature,
      }
    : y;
};

const toEdDsa = (map: CborMap): KeyImport | WebAuthnRejection => {
  const problem = checkShape(map, [KEY_TYPE.OKP, CURVE.Ed25519]);
  const x = coordinateAt(map, KEY.x);

  if (problem !== undefined) {
    return problem;
  }

  return x instanceof Uint8Array
    ? {
        _tag: "Readable",
        jwk: { kty: "OKP", crv: "Ed25519", x: toBase64url(x) },
        importParams: { name: "Ed25519" },
        verifyParams: { name: "Ed25519" },
        readSignature: asIs,
      }
    : x;
};

const findRsaProblem = (
  modulus: Uint8Array,
  exponent: Uint8Array,
): WebAuthnRejection | undefined => {
  const modulusBits = bitLength(modulus);

  const exponentValue = trimLeadingZeros(exponent).reduce(
    (value, byte) => value * 256 + byte,
    0,
  );

  if (modulusBits < RSA_MODULUS_BITS.min) {
    return invalid("RSA の法が 2048 ビットより短い");
  }

  if (modulusBits > RSA_MODULUS_BITS.max) {
    return invalid("RSA の法が 4096 ビットより長い");
  }

  if (bitLength(exponent) > RSA_EXPONENT_MAX_BITS) {
    return invalid("RSA の公開指数が 33 ビットより大きい");
  }

  if (exponentValue < RSA_EXPONENT_MIN) {
    return invalid("RSA の公開指数が 3 より小さい");
  }

  return exponentValue % 2 === 0 ? invalid("RSA の公開指数が偶数") : undefined;
};

const toRs256 = (map: CborMap): KeyImport | WebAuthnRejection => {
  const problem = checkShape(map, [KEY_TYPE.RSA, undefined]);
  const modulus = bytesAt(map, KEY.n);
  const exponent = bytesAt(map, KEY.e);

  if (problem !== undefined) {
    return problem;
  }

  if (!(modulus instanceof Uint8Array)) {
    return modulus;
  }

  if (!(exponent instanceof Uint8Array)) {
    return exponent;
  }

  return (
    findRsaProblem(modulus, exponent) ?? {
      _tag: "Readable",
      jwk: {
        kty: "RSA",
        n: toBase64url(trimLeadingZeros(modulus)),
        e: toBase64url(trimLeadingZeros(exponent)),
      },
      importParams: { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      verifyParams: { name: "RSASSA-PKCS1-v1_5" },
      readSignature: asIs,
    }
  );
};

/** COSE_Key の map を、アルゴリズムに合う形か確かめて、WebCrypto の値に直す。 */
export const toKeyImport = (
  map: CborMap,
  algorithm: CoseAlgorithm,
): KeyImport | WebAuthnRejection => {
  switch (algorithm) {
    case COSE_ALGORITHM.ES256: {
      return toEs256(map);
    }
    case COSE_ALGORITHM.EdDSA: {
      return toEdDsa(map);
    }
    case COSE_ALGORITHM.RS256: {
      return toRs256(map);
    }
  }
};
