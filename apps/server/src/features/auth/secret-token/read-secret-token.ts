import { hashSecret } from "./hash-secret";

/** 届いた token を、DB の行の ID と secret のハッシュに分けたもの。 */
export type SecretTokenParts = {
  /** 結果の種類。 */
  readonly _tag: "Read";
  /** DB の行を引くための、token の前半。 */
  readonly id: string;
  /** token の後半の secret の SHA-256。 */
  readonly secretHash: Uint8Array<ArrayBuffer>;
};

/** 届いた token が、`{id}.{secret}` の形でないこと。 */
export type MalformedSecretToken = {
  /** 結果の種類。 */
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
