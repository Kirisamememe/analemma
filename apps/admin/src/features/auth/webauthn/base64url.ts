/** base64url(padding 無し)の文字列を、バイト列に戻す。 */
export const fromBase64Url = (value: string): Uint8Array<ArrayBuffer> =>
  Uint8Array.fromBase64(value, { alphabet: "base64url" });

/** バイト列を、base64url(padding 無し)の文字列にする。 */
export const toBase64Url = (bytes: ArrayBuffer): string =>
  new Uint8Array(bytes).toBase64({ alphabet: "base64url", omitPadding: true });
