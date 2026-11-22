import {
  decodeCbor,
  isCborMap,
} from "@/features/auth/webauthn/cbor/decode-cbor";
import {
  type WebAuthnRejection,
  reject,
} from "@/features/auth/webauthn/rejection";

/** authenticatorData の flags。 */
export type AuthenticatorFlags = {
  /** UP:利用者がその場にいたか。 */
  readonly userPresent: boolean;
  /** UV:生体認証か PIN で本人を確かめたか。 */
  readonly userVerified: boolean;
  /** BE:ほかの端末へ同期されうるパスキーか。 */
  readonly backupEligible: boolean;
  /** BS:今、同期されているか。 */
  readonly backedUp: boolean;
};

/** 登録のときに authenticatorData に入る、新しい資格情報。 */
export type AttestedCredential = {
  /** 認証器の機種を表す 16 バイト。 */
  readonly aaguid: Uint8Array<ArrayBuffer>;
  /** 資格情報の ID。 */
  readonly credentialId: Uint8Array<ArrayBuffer>;
  /** COSE_Key の CBOR のままの公開鍵。 */
  readonly publicKey: Uint8Array<ArrayBuffer>;
};

/** 読んだ authenticatorData。 */
export type AuthenticatorData = {
  /** どの結果か。 */
  readonly _tag: "Parsed";
  /** RP ID の SHA-256。 */
  readonly rpIdHash: Uint8Array<ArrayBuffer>;
  /** flags。 */
  readonly flags: AuthenticatorFlags;
  /** `signCount`。 */
  readonly signCount: number;
  /** AT のビットに対応する資格情報。 */
  readonly attestedCredential?: AttestedCredential;
};

/** 資格情報と、読み終えた位置。 */
type ReadCredential = {
  /** どの結果か。 */
  readonly _tag: "Read";
  /** 読んだ資格情報。 */
  readonly credential: AttestedCredential;
  /** 公開鍵のすぐ後ろの位置。 */
  readonly end: number;
};

const HEADER_LENGTH = 37;
const AAGUID_LENGTH = 16;
const CREDENTIAL_HEADER_LENGTH = AAGUID_LENGTH + 2;
const FLAG = {
  userPresent: 0x01,
  userVerified: 0x04,
  backupEligible: 0x08,
  backedUp: 0x10,
  attestedCredentialData: 0x40,
  extensionData: 0x80,
} as const;

const invalid = (problem: string): WebAuthnRejection =>
  reject(`authenticatorData: ${problem}`);

const readAttestedCredential = (
  bytes: Uint8Array<ArrayBuffer>,
): ReadCredential | WebAuthnRejection => {
  if (bytes.length < HEADER_LENGTH + CREDENTIAL_HEADER_LENGTH) {
    return invalid("資格情報の途中で切れている");
  }

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const idStart = HEADER_LENGTH + CREDENTIAL_HEADER_LENGTH;
  const keyStart = idStart + view.getUint16(HEADER_LENGTH + AAGUID_LENGTH);

  if (keyStart > bytes.length) {
    return invalid("資格情報の ID の途中で切れている");
  }

  const key = decodeCbor(bytes, keyStart);

  if (key._tag === "Rejected") {
    return key;
  }

  return {
    _tag: "Read",
    credential: {
      aaguid: bytes.slice(HEADER_LENGTH, HEADER_LENGTH + AAGUID_LENGTH),
      credentialId: bytes.slice(idStart, keyStart),
      publicKey: bytes.slice(keyStart, key.end),
    },
    end: key.end,
  };
};

const skipExtensions = (
  bytes: Uint8Array<ArrayBuffer>,
  offset: number,
): number | WebAuthnRejection => {
  const extensions = decodeCbor(bytes, offset);

  if (extensions._tag === "Rejected") {
    return extensions;
  }

  return isCborMap(extensions.value)
    ? extensions.end
    : invalid("拡張が CBOR の map でない");
};

/** authenticatorData のバイト列を読む。 */
export const parseAuthenticatorData = (
  bytes: Uint8Array<ArrayBuffer>,
): AuthenticatorData | WebAuthnRejection => {
  if (bytes.length < HEADER_LENGTH) {
    return invalid("短すぎる");
  }

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const flagByte = view.getUint8(32);
  const has = (flag: number): boolean => (flagByte & flag) !== 0;
  const attested = has(FLAG.attestedCredentialData)
    ? readAttestedCredential(bytes)
    : undefined;

  if (attested?._tag === "Rejected") {
    return attested;
  }

  const afterCredential = attested?.end ?? HEADER_LENGTH;
  const end = has(FLAG.extensionData)
    ? skipExtensions(bytes, afterCredential)
    : afterCredential;

  if (typeof end !== "number") {
    return end;
  }

  if (end !== bytes.length) {
    return invalid("末尾に余りがある");
  }

  return {
    _tag: "Parsed",
    rpIdHash: bytes.slice(0, 32),
    flags: {
      userPresent: has(FLAG.userPresent),
      userVerified: has(FLAG.userVerified),
      backupEligible: has(FLAG.backupEligible),
      backedUp: has(FLAG.backedUp),
    },
    signCount: view.getUint32(33),
    ...(attested === undefined
      ? {}
      : { attestedCredential: attested.credential }),
  };
};
