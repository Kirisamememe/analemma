/** authenticatorData の flags のビット。 */
export const AUTHENTICATOR_FLAG = {
  UP: 0x01,
  UV: 0x04,
  BE: 0x08,
  BS: 0x10,
  AT: 0x40,
  ED: 0x80,
} as const;

/** 登録のときに authenticatorData に入れる資格情報。 */
export type FakeAttestedCredential = {
  /** 認証器の機種を表す 16 バイト。 */
  readonly aaguid: Uint8Array;
  /** 資格情報の ID。 */
  readonly credentialId: Uint8Array;
  /** 公開鍵の COSE_Key。 */
  readonly publicKey: Uint8Array;
};

/** authenticatorData に入れる値。 */
export type AuthenticatorDataInput = {
  /** RP ID の SHA-256。 */
  readonly rpIdHash: Uint8Array;
  /** `AUTHENTICATOR_FLAG` を組み合わせた flags のバイト。 */
  readonly flags: number;
  /** `signCount`。 */
  readonly signCount: number;
  /** AT のビットに対応する資格情報。 */
  readonly credential?: FakeAttestedCredential;
  /** ED のビットに対応する拡張の CBOR。 */
  readonly extensions?: Uint8Array;
};

/** テストのために、RP ID の SHA-256 を求める。 */
export const hashRpId = async (
  rpId: string,
): Promise<Uint8Array<ArrayBuffer>> =>
  new Uint8Array(
    await crypto.subtle.digest("SHA-256", new TextEncoder().encode(rpId)),
  );

/** テストのために、authenticatorData を組み立てる。 */
export const buildAuthenticatorData = ({
  credential,
  extensions = new Uint8Array(),
  flags,
  rpIdHash,
  signCount,
}: AuthenticatorDataInput): Uint8Array<ArrayBuffer> => {
  const header = new Uint8Array(37);
  const view = new DataView(header.buffer);

  header.set(rpIdHash.subarray(0, 32));
  view.setUint8(32, flags);
  view.setUint32(33, signCount);

  const attested =
    credential === undefined
      ? []
      : [
          ...credential.aaguid,
          credential.credentialId.length >> 8,
          credential.credentialId.length & 0xff,
          ...credential.credentialId,
          ...credential.publicKey,
        ];

  return new Uint8Array([...header, ...attested, ...extensions]);
};
