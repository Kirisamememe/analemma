import { type WebAuthnRejection, reject } from "../rejection";

/** DER から r‖s に直した、ES256 の署名。 */
export type RawSignature = {
  /** 結果の種類。 */
  readonly _tag: "Read";
  /** 32 バイトずつの r と s をつないだ署名。 */
  readonly signature: Uint8Array<ArrayBuffer>;
};

/** DER の INTEGER を読んだ値と、続きの位置。 */
type DerInteger = {
  /** 結果の種類。 */
  readonly _tag: "Read";
  /** 先頭の 0 を落とした値。 */
  readonly value: Uint8Array;
  /** INTEGER のすぐ後ろの位置。 */
  readonly next: number;
};

const COORDINATE_LENGTH = 32;
const SEQUENCE = 0x30;
const INTEGER = 0x02;

const invalid = (problem: string): WebAuthnRejection =>
  reject(`ES256 の署名: ${problem}`);

const readInteger = (
  der: Uint8Array,
  offset: number,
): DerInteger | WebAuthnRejection => {
  const length = der[offset + 1] ?? 0;
  const start = offset + 2;

  if (der[offset] !== INTEGER || length === 0 || start + length > der.length) {
    return invalid("INTEGER が読めない");
  }

  const body = der.subarray(start, start + length);

  if ((body[0] ?? 0) >= 0x80) {
    return invalid("負の数");
  }

  let skip = 0;

  while (skip < body.length - 1 && body[skip] === 0) {
    skip += 1;
  }

  const value = body.subarray(skip);

  return value.length > COORDINATE_LENGTH
    ? invalid("値が大きすぎる")
    : { _tag: "Read", value, next: start + length };
};

/** ES256 の署名を、DER から r‖s に直す。 */
export const readDerSignature = (
  der: Uint8Array,
): RawSignature | WebAuthnRejection => {
  if (der[0] !== SEQUENCE || der[1] !== der.length - 2) {
    return invalid("SEQUENCE が読めない");
  }

  const r = readInteger(der, 2);

  if (r._tag === "Rejected") {
    return r;
  }

  const s = readInteger(der, r.next);

  if (s._tag === "Rejected") {
    return s;
  }

  if (s.next !== der.length) {
    return invalid("末尾に余りがある");
  }

  const signature = new Uint8Array(COORDINATE_LENGTH * 2);

  signature.set(r.value, COORDINATE_LENGTH - r.value.length);
  signature.set(s.value, COORDINATE_LENGTH * 2 - s.value.length);

  return { _tag: "Read", signature };
};
