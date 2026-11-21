/** token の secret の文字列の SHA-256 を求める。 */
export const hashSecret = async (
  secret: string,
): Promise<Uint8Array<ArrayBuffer>> =>
  new Uint8Array(
    await crypto.subtle.digest("SHA-256", new TextEncoder().encode(secret)),
  );
