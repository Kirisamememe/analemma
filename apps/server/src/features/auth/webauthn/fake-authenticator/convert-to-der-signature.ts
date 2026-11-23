const toDerInteger = (bytes: Uint8Array): number[] => {
  const start = Math.min(
    bytes.findIndex((byte) => byte !== 0),
    bytes.length - 1,
  );

  const value = [...bytes.subarray(start === -1 ? bytes.length - 1 : start)];
  const body = (value[0] ?? 0) >= 0x80 ? [0, ...value] : value;

  return [0x02, body.length, ...body];
};

/** テストのために、WebCrypto の ES256 の署名を認証器と同じ DER に直す。 */
export const convertToDerSignature = (
  raw: Uint8Array,
): Uint8Array<ArrayBuffer> => {
  const body = [
    ...toDerInteger(raw.subarray(0, 32)),
    ...toDerInteger(raw.subarray(32)),
  ];

  return new Uint8Array([0x30, body.length, ...body]);
};
