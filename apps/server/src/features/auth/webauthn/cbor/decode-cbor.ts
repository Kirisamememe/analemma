import { type WebAuthnRejection, reject } from "../rejection";

/** 読める CBOR の値。 */
export type CborValue =
  | number
  | string
  | boolean
  | null
  | Uint8Array<ArrayBuffer>
  | readonly CborValue[]
  | CborMap;

/** キーが整数か文字列の、CBOR の map。 */
export type CborMap = ReadonlyMap<number | string, CborValue>;

/** 読んだ CBOR の値と、読み終えた位置。 */
export type DecodedCbor = {
  /** どの結果か。 */
  readonly _tag: "Decoded";
  /** 読んだ値。 */
  readonly value: CborValue;
  /** 値のすぐ後ろの位置。 */
  readonly end: number;
};

/** 読みかけの値か、受け付けない理由。 */
type Read<T> =
  | {
      /** どの結果か。 */
      readonly _tag: "Read";
      /** 読んだ値。 */
      readonly value: T;
    }
  | WebAuthnRejection;

const MAX_DEPTH = 16;
const INDEFINITE_LENGTH = 31;
const ARGUMENT_SIZES = new Map([
  [24, 1],
  [25, 2],
  [26, 4],
  [27, 8],
]);
const SIMPLE_VALUES = new Map([
  [20, false],
  [21, true],
  [22, null],
]);

const utf8 = new TextDecoder("utf-8", { ignoreBOM: true });

const invalid = (problem: string): WebAuthnRejection =>
  reject(`CBOR: ${problem}`);

const read = <T>(value: T): Read<T> => ({ _tag: "Read", value });

const toSafeInteger = (value: bigint): Read<number> =>
  value > BigInt(Number.MAX_SAFE_INTEGER)
    ? invalid("2^53 以上の整数")
    : read(Number(value));

const readSimple = (info: number): Read<CborValue> => {
  const value = SIMPLE_VALUES.get(info);

  return value === undefined
    ? invalid("浮動小数と、false・true・null のほかの単純な値は受け付けない")
    : read(value);
};

/** CBOR の値が map かを返す。 */
export const isCborMap = (value: CborValue): value is CborMap =>
  value instanceof Map;

/** CBOR の値を1つ読む。 */
export const decodeCbor = (
  bytes: Uint8Array<ArrayBuffer>,
  start = 0,
): DecodedCbor | WebAuthnRejection => {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let offset = start;

  const take = (length: number): Read<Uint8Array<ArrayBuffer>> => {
    if (length > bytes.length - offset) {
      return invalid("途中で切れている");
    }

    const slice = bytes.subarray(offset, offset + length);

    offset += length;

    return read(slice);
  };

  const readArgument = (info: number): Read<number> => {
    if (info < 24) {
      return read(info);
    }

    const size = ARGUMENT_SIZES.get(info);

    if (size === undefined) {
      return invalid(
        info === INDEFINITE_LENGTH ? "不定長は受け付けない" : "予約の値",
      );
    }

    const at = offset;
    const taken = take(size);

    if (taken._tag === "Rejected") {
      return taken;
    }

    switch (size) {
      case 1: {
        return read(view.getUint8(at));
      }

      case 2: {
        return read(view.getUint16(at));
      }

      case 4: {
        return read(view.getUint32(at));
      }

      default: {
        return toSafeInteger(view.getBigUint64(at));
      }
    }
  };

  const readNegative = (info: number): Read<number> => {
    const argument = readArgument(info);

    if (argument._tag === "Rejected") {
      return argument;
    }

    return argument.value >= Number.MAX_SAFE_INTEGER
      ? invalid("2^53 以上の整数")
      : read(-1 - argument.value);
  };

  const readBytes = (info: number): Read<Uint8Array<ArrayBuffer>> => {
    const length = readArgument(info);

    if (length._tag === "Rejected") {
      return length;
    }

    const taken = take(length.value);

    return taken._tag === "Rejected" ? taken : read(taken.value.slice());
  };

  const readText = (info: number): Read<string> => {
    const raw = readBytes(info);

    if (raw._tag === "Rejected") {
      return raw;
    }

    return read(utf8.decode(raw.value));
  };

  const readArray = (info: number, depth: number): Read<CborValue[]> => {
    const count = readArgument(info);

    if (count._tag === "Rejected") {
      return count;
    }

    const items: CborValue[] = [];

    for (let index = 0; index < count.value; index += 1) {
      const item = readItem(depth + 1);

      if (item._tag === "Rejected") {
        return item;
      }

      items.push(item.value);
    }

    return read(items);
  };

  const readMap = (info: number, depth: number): Read<CborMap> => {
    const count = readArgument(info);

    if (count._tag === "Rejected") {
      return count;
    }

    const map = new Map<number | string, CborValue>();

    for (let index = 0; index < count.value; index += 1) {
      const key = readItem(depth + 1);

      if (key._tag === "Rejected") {
        return key;
      }

      if (typeof key.value !== "number" && typeof key.value !== "string") {
        return invalid("map のキーが整数でも文字列でもない");
      }

      if (map.has(key.value)) {
        return invalid("map のキーが重なっている");
      }

      const value = readItem(depth + 1);

      if (value._tag === "Rejected") {
        return value;
      }

      map.set(key.value, value.value);
    }

    return read(map);
  };

  const readItem = (depth: number): Read<CborValue> => {
    if (depth > MAX_DEPTH) {
      return invalid("入れ子が深すぎる");
    }

    const head = take(1);

    if (head._tag === "Rejected") {
      return head;
    }

    const [byte = 0] = head.value;
    const info = byte & 0x1f;

    switch (byte >> 5) {
      case 0: {
        return readArgument(info);
      }

      case 1: {
        return readNegative(info);
      }

      case 2: {
        return readBytes(info);
      }

      case 3: {
        return readText(info);
      }

      case 4: {
        return readArray(info, depth);
      }

      case 5: {
        return readMap(info, depth);
      }

      case 6: {
        return invalid("タグは受け付けない");
      }

      default: {
        return readSimple(info);
      }
    }
  };

  const item = readItem(0);

  return item._tag === "Rejected"
    ? item
    : { _tag: "Decoded", value: item.value, end: offset };
};
