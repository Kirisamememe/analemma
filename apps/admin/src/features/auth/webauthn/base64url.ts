const toBinary = (bytes: Uint8Array): string => {
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCodePoint(byte);
  }

  return binary;
};

/** base64url(padding 無し)の文字列を、バイト列に戻す。 */
export const fromBase64Url = (value: string): Uint8Array<ArrayBuffer> => {
  const binary = atob(value.replaceAll("-", "+").replaceAll("_", "/"));

  return Uint8Array.from(binary, (character) => character.codePointAt(0) ?? 0);
};

/** バイト列を、base64url(padding 無し)の文字列にする。 */
export const toBase64Url = (bytes: ArrayBuffer): string =>
  btoa(toBinary(new Uint8Array(bytes)))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/v, "");
