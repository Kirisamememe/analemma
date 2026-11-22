/** token の secret の文字列の SHA-256 を求める。 */
export const hashSecret = async (
  secret: string,
): Promise<Uint8Array<ArrayBuffer>> =>
  new Uint8Array(
    await crypto.subtle.digest("SHA-256", new TextEncoder().encode(secret)),
  );

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

/** 新しく作った token と、DB に置く値。 */
export type IssuedSecretToken = {
  /** DB の行を引くための、token の前半。 */
  readonly id: string;
  /** token の後半の secret の SHA-256。 */
  readonly secretHash: Uint8Array<ArrayBuffer>;
  /** 利用者に渡す `{id}.{secret}` の文字列。 */
  readonly token: string;
};

const ID_BYTES = 16;
const SECRET_BYTES = 32;

const randomBase64url = (length: number): string =>
  crypto
    .getRandomValues(new Uint8Array(length))
    .toBase64({ alphabet: "base64url", omitPadding: true });

/** `{id}.{secret}` の形の token を、乱数で新しく作る。 */
export const issueSecretToken = async (): Promise<IssuedSecretToken> => {
  const id = randomBase64url(ID_BYTES);
  const secret = randomBase64url(SECRET_BYTES);

  return { id, secretHash: await hashSecret(secret), token: `${id}.${secret}` };
};

/** 届いた token を、DB の行の ID と secret のハッシュに分けたもの。 */
export type SecretTokenParts = {
  /** どの結果か。 */
  readonly _tag: "Read";
  /** DB の行を引くための、token の前半。 */
  readonly id: string;
  /** token の後半の secret の SHA-256。 */
  readonly secretHash: Uint8Array<ArrayBuffer>;
};

/** 届いた token が、`{id}.{secret}` の形でないこと。 */
export type MalformedSecretToken = {
  /** どの結果か。 */
  readonly _tag: "Malformed";
};

const TOKEN = /^(?<id>[A-Za-z0-9_\-]{22})\.(?<secret>[A-Za-z0-9_\-]{43})$/v;

/** 届いた `{id}.{secret}` の token を、ID と secret のハッシュに分ける。 */
export const readSecretToken = async (
  token: string,
): Promise<SecretTokenParts | MalformedSecretToken> => {
  const groups = TOKEN.exec(token)?.groups;
  const id = groups?.["id"];
  const secret = groups?.["secret"];

  return id === undefined || secret === undefined
    ? { _tag: "Malformed" }
    : { _tag: "Read", id, secretHash: await hashSecret(secret) };
};
