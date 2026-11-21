import type { RelyingParty } from "../../../platform/parse-relying-party";
import type {
  ChallengePurpose,
  ChallengeStore,
} from "../challenge/create-challenge-store";
import { parseClientData } from "../webauthn/client-data/parse-client-data";
import type { CoseAlgorithm } from "../webauthn/cose-key/cose-algorithm";
import { verifyRegistration } from "../webauthn/verify-registration";
import {
  type RegistrationCredentialInput,
  decodeRegistrationCredential,
} from "./decode-registration-credential";
import { formatAaguid } from "./format-aaguid";
import { PASSKEY_ALGORITHMS } from "./passkey-policy";

/** 検証できた、保存する前のパスキー。 */
export type NewPasskey = {
  /** 資格情報の ID の、base64url の正規形。 */
  readonly id: string;
  /** COSE_Key の公開鍵。 */
  readonly publicKey: Uint8Array<ArrayBuffer>;
  /** COSE のアルゴリズムの番号。 */
  readonly algorithm: CoseAlgorithm;
  /** `signCount`。 */
  readonly signCount: number;
  /** 仕様にある値だけを残した transports。 */
  readonly transports: readonly string[];
  /** UUID の形の AAGUID。 */
  readonly aaguid: string;
  /** BE:ほかの端末へ同期されうるパスキーか。 */
  readonly backupEligible: boolean;
  /** BS:今、同期されているか。 */
  readonly backedUp: boolean;
};

/** 登録の資格情報を検証できたこと。 */
export type VerifiedPasskey = {
  /** 結果の種類。 */
  readonly _tag: "Verified";
  /** 保存するパスキー。 */
  readonly passkey: NewPasskey;
};

/** 登録の資格情報を受け付けなかったこと。 */
export type RegistrationFailure =
  | {
      /** 知らない・期限切れ・用途の違う challenge。 */
      readonly _tag: "ChallengeExpired";
    }
  | {
      /** 形か検証の手順に合わない資格情報。 */
      readonly _tag: "InvalidCredential";
      /** 受け付けなかった理由。 */
      readonly problem: string;
    };

/** パスキーの登録の検証に要る値。 */
export type PasskeyRegistration = {
  /** 出した challenge の表。 */
  readonly challenges: ChallengeStore;
  /** 管理画面の origin と RP ID。 */
  readonly relyingParty: RelyingParty;
  /** 届いた資格情報。 */
  readonly credential: RegistrationCredentialInput;
  /** challenge を出した用途。 */
  readonly purpose: ChallengePurpose;
  /** 届いた日時。 */
  readonly now: Date;
};

/** 登録の資格情報の challenge を取り出し、仕様の手順で検証する。 */
export const verifyPasskeyRegistration = async ({
  challenges,
  credential,
  now,
  purpose,
  relyingParty,
}: PasskeyRegistration): Promise<VerifiedPasskey | RegistrationFailure> => {
  const decoded = decodeRegistrationCredential(credential);
  const clientData = parseClientData(decoded.response.clientDataJSON);

  if (clientData._tag === "Rejected") {
    return { _tag: "InvalidCredential", problem: clientData.problem };
  }

  const taken = challenges.take(clientData.challenge, { purpose, now });

  if (taken._tag === "Missing") {
    return { _tag: "ChallengeExpired" };
  }

  const verified = await verifyRegistration(decoded.response, {
    challenge: taken.challenge,
    origin: relyingParty.origin,
    rpId: relyingParty.rpId,
    algorithms: PASSKEY_ALGORITHMS,
    requireUserVerification: true,
  });

  if (verified._tag === "Rejected") {
    return { _tag: "InvalidCredential", problem: verified.problem };
  }

  const id = verified.credentialId.toBase64({
    alphabet: "base64url",
    omitPadding: true,
  });

  if (id !== decoded.id) {
    return {
      _tag: "InvalidCredential",
      problem:
        "ブラウザが送った資格情報の ID が、authenticatorData の ID と違う",
    };
  }

  return {
    _tag: "Verified",
    passkey: {
      id,
      publicKey: verified.publicKey,
      algorithm: verified.algorithm,
      signCount: verified.signCount,
      transports: decoded.transports,
      aaguid: formatAaguid(verified.aaguid),
      backupEligible: verified.backupEligible,
      backedUp: verified.backedUp,
    },
  };
};
