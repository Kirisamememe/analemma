import { decodeCbor, isCborMap } from "../cbor/decode-cbor";
import {
  PASSED,
  type WebAuthnPassed,
  type WebAuthnRejection,
  reject,
} from "../rejection";
import { type CoseAlgorithm, isCoseAlgorithm } from "./cose-algorithm";
import { toKeyImport } from "./to-key-import";

/** 認証器の署名を、署名の対象に照らして確かめる。 */
export type VerifySignature = (
  signature: Uint8Array<ArrayBuffer>,
  data: Uint8Array<ArrayBuffer>,
) => Promise<WebAuthnPassed | WebAuthnRejection>;

/** 署名を検証できる形にした公開鍵。 */
export type CoseKey = {
  /** 結果の種類。 */
  readonly _tag: "Imported";
  /** COSE のアルゴリズムの番号。 */
  readonly algorithm: CoseAlgorithm;
  /** 認証器が返した形の署名を検証する。 */
  readonly verify: VerifySignature;
};

const ALGORITHM_KEY = 3;

const invalid = (problem: string): WebAuthnRejection =>
  reject(`公開鍵: ${problem}`);

/** COSE_Key の公開鍵を、署名を検証できる形にする。 */
export const importCoseKey = async (
  cose: Uint8Array<ArrayBuffer>,
): Promise<CoseKey | WebAuthnRejection> => {
  const decoded = decodeCbor(cose);

  if (decoded._tag === "Rejected") {
    return decoded;
  }

  const { value, end } = decoded;

  if (!isCborMap(value)) {
    return invalid("CBOR の map でない");
  }

  if (end !== cose.length) {
    return invalid("末尾に余りがある");
  }

  const algorithm = value.get(ALGORITHM_KEY);

  if (typeof algorithm !== "number") {
    return invalid("アルゴリズムが無い");
  }

  if (!isCoseAlgorithm(algorithm)) {
    return invalid(`扱わないアルゴリズム(${String(algorithm)})`);
  }

  const keyImport = toKeyImport(value, algorithm);

  if (keyImport._tag === "Rejected") {
    return keyImport;
  }

  const { importParams, jwk, readSignature, verifyParams } = keyImport;
  const key = await crypto.subtle.importKey("jwk", jwk, importParams, false, [
    "verify",
  ]);

  return {
    _tag: "Imported",
    algorithm,
    verify: async (signature, data) => {
      const readable = readSignature(signature);

      if (!(readable instanceof Uint8Array)) {
        return readable;
      }

      return (await crypto.subtle.verify(verifyParams, key, readable, data))
        ? PASSED
        : reject("署名が合わない");
    },
  };
};
