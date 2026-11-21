/** 2つの secret のハッシュが同じかを、定数時間で比べる。 */
export const equalSecretHashes = (
  left: Uint8Array,
  right: Uint8Array,
): boolean => {
  if (left.length !== right.length) {
    return false;
  }

  let difference = 0;

  for (const [index, byte] of left.entries()) {
    difference |= byte ^ (right[index] ?? 0);
  }

  return difference === 0;
};
