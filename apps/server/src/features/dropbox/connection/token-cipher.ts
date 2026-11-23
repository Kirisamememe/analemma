const IV_BYTES = 12;
const PURPOSE = new TextEncoder().encode("dropbox-refresh-token"); // 別の用途で暗号にした値と取り違えない

/** Dropbox の refresh token を、DB に置く前に AES-GCM で暗号にする。 */
export const encryptToken = async (
  key: CryptoKey,
  token: string,
): Promise<Uint8Array<ArrayBuffer>> => {
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));

  const sealed = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: "AES-GCM", iv, additionalData: PURPOSE },
      key,
      new TextEncoder().encode(token),
    ),
  );

  const stored = new Uint8Array(IV_BYTES + sealed.length);

  stored.set(iv);
  stored.set(sealed, IV_BYTES);

  return stored;
};

/** DB から読んだ暗号を、Dropbox の refresh token に戻す。 */
export const decryptToken = async (
  key: CryptoKey,
  stored: Uint8Array<ArrayBuffer>,
): Promise<string> =>
  new TextDecoder().decode(
    await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: stored.subarray(0, IV_BYTES),
        additionalData: PURPOSE,
      },
      key,
      stored.subarray(IV_BYTES),
    ),
  );
