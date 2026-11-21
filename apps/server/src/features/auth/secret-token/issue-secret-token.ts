import { hashSecret } from "./hash-secret";

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
