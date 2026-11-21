/** テストで CBOR に書き出せる値。 */
export type CborInput =
  | number
  | string
  | boolean
  | null
  | Uint8Array
  | readonly CborInput[]
  | ReadonlyMap<number | string, CborInput>
  | RawCbor;

/** 読み取りが受け付けない形を、そのまま書くためのバイト列。 */
export type RawCbor = {
  /** そのまま書くバイト列。 */
  readonly raw: Uint8Array;
};

const head = (major: number, argument: number): number[] => {
  const prefix = major << 5;

  if (argument < 24) {
    return [prefix | argument];
  }

  if (argument < 2 ** 8) {
    return [prefix | 24, argument];
  }

  if (argument < 2 ** 16) {
    return [prefix | 25, argument >> 8, argument & 0xff];
  }

  const bytes = new Uint8Array(9);
  const view = new DataView(bytes.buffer);

  if (argument < 2 ** 32) {
    bytes[0] = prefix | 26;
    view.setUint32(1, argument);

    return [...bytes.subarray(0, 5)];
  }

  bytes[0] = prefix | 27;
  view.setBigUint64(1, BigInt(argument));

  return [...bytes];
};

const isList = (value: CborInput): value is readonly CborInput[] =>
  Array.isArray(value);

const isMap = (
  value: CborInput,
): value is ReadonlyMap<number | string, CborInput> => value instanceof Map;

const encodeList = (items: readonly CborInput[]): number[] => {
  const bytes = head(4, items.length);

  for (const item of items) {
    bytes.push(...encodeItem(item));
  }

  return bytes;
};

const encodeMap = (map: ReadonlyMap<number | string, CborInput>): number[] => {
  const bytes = head(5, map.size);

  for (const [key, item] of map) {
    bytes.push(...encodeItem(key), ...encodeItem(item));
  }

  return bytes;
};

const encodeItem = (value: CborInput): number[] => {
  if (typeof value === "boolean") {
    return [value ? 0xf5 : 0xf4];
  }

  if (value === null) {
    return [0xf6];
  }

  if (typeof value === "number") {
    return value >= 0 ? head(0, value) : head(1, -1 - value);
  }

  if (typeof value === "string") {
    const bytes = new TextEncoder().encode(value);

    return [...head(3, bytes.length), ...bytes];
  }

  if (value instanceof Uint8Array) {
    return [...head(2, value.length), ...value];
  }

  if (isList(value)) {
    return encodeList(value);
  }

  if (isMap(value)) {
    return encodeMap(value);
  }

  return [...value.raw];
};

/** テストのために、値を CBOR に書き出す。 */
export const encodeCbor = (value: CborInput): Uint8Array<ArrayBuffer> =>
  new Uint8Array(encodeItem(value));
