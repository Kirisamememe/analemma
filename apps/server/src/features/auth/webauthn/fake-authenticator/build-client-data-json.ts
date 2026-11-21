/** clientDataJSON に書く値。 */
export type ClientDataInput = {
  /** `webauthn.create` か `webauthn.get`。 */
  readonly type: string;
  /** server が出した challenge のバイト列。 */
  readonly challenge: Uint8Array;
  /** リクエストを作ったページの origin。 */
  readonly origin: string;
  /** ほかの origin の iframe の中で作られたか。 */
  readonly crossOrigin?: boolean;
  /** iframe を置いた最上位のページの origin。 */
  readonly topOrigin?: string;
};

/** テストのために、ブラウザの代わりに clientDataJSON を作る。 */
export const buildClientDataJson = ({
  challenge,
  crossOrigin = false,
  origin,
  topOrigin,
  type,
}: ClientDataInput): Uint8Array<ArrayBuffer> =>
  new TextEncoder().encode(
    JSON.stringify({
      type,
      challenge: challenge.toBase64({
        alphabet: "base64url",
        omitPadding: true,
      }),
      origin,
      crossOrigin,
      ...(topOrigin === undefined ? {} : { topOrigin }),
    }),
  );
