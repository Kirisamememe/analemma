import type { ContractOutputs } from "@analemma/contract";

import { CHALLENGE_LIFETIME_MS } from "@/features/auth/challenge/create-challenge-store";
import {
  ADMIN_DISPLAY_NAME,
  ADMIN_USER_NAME,
  PASSKEY_ALGORITHMS,
  RP_NAME,
} from "@/features/auth/registration/passkey-policy";

/** 登録の options の出力。 */
export type RegistrationOptions =
  ContractOutputs["auth"]["enrollment"]["options"];

/** 登録の options に並べる、登録済みのパスキー。 */
export type RegisteredPasskey = {
  /** 資格情報の ID の base64url。 */
  readonly id: string;
  /** 認証器との通信の手段。 */
  readonly transports: readonly string[];
};

/** 登録の options を作るのに要る値。 */
export type RegistrationOptionsInput = {
  /** 出した challenge の base64url。 */
  readonly challenge: string;
  /** RP ID。 */
  readonly rpId: string;
  /** 管理者の user handle。 */
  readonly userHandle: Uint8Array;
  /** 同じ認証器に2つめを作らせないための、登録済みのパスキー。 */
  readonly registered: readonly RegisteredPasskey[];
};

/** パスキーの登録の options を作る。 */
export const createRegistrationOptions = ({
  challenge,
  registered,
  rpId,
  userHandle,
}: RegistrationOptionsInput): RegistrationOptions => ({
  challenge,
  rp: { id: rpId, name: RP_NAME },
  user: {
    id: userHandle.toBase64({ alphabet: "base64url", omitPadding: true }),
    name: ADMIN_USER_NAME,
    displayName: ADMIN_DISPLAY_NAME,
  },
  pubKeyCredParams: PASSKEY_ALGORITHMS.map((alg) => ({
    type: "public-key",
    alg,
  })),
  excludeCredentials: registered.map(({ id, transports }) => ({
    type: "public-key",
    id,
    transports: [...transports],
  })),
  authenticatorSelection: {
    residentKey: "required",
    requireResidentKey: true,
    userVerification: "required",
  },
  attestation: "none",
  timeout: CHALLENGE_LIFETIME_MS,
});
