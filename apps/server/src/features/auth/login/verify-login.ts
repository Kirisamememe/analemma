import type {
  ChallengePurpose,
  ChallengeStore,
} from "@/features/auth/challenge/create-challenge-store";
import {
  type AuthenticationCredentialInput,
  decodeAuthenticationCredential,
} from "@/features/auth/login/decode-authentication-credential";
import {
  type LoginPasskey,
  findLoginPasskey,
} from "@/features/auth/login/find-login-passkey.query";
import { parseClientData } from "@/features/auth/webauthn/client-data/parse-client-data";
import { verifyAuthentication } from "@/features/auth/webauthn/verify-authentication";
import type { DatabaseExecutor } from "@/platform/database";
import type { RelyingParty } from "@/platform/parse-relying-party";

/** ログインの資格情報を検証できたこと。 */
export type VerifiedLogin = {
  /** どの結果か。 */
  readonly _tag: "Verified";
  /** ログインに使ったパスキー。 */
  readonly passkey: LoginPasskey;
  /** 届いた `signCount`。 */
  readonly signCount: number;
  /** BS:今、同期されているか。 */
  readonly backedUp: boolean;
  /** `signCount` が、保存した値から戻ったか。 */
  readonly counterWentBack: boolean;
  /** BE が、登録したときと変わったか。 */
  readonly backupEligibilityChanged: boolean;
};

/** ログインの資格情報を受け付けなかったこと。 */
export type LoginFailure =
  | {
      /** 知らない・期限切れ・用途の違う challenge。 */
      readonly _tag: "ChallengeExpired";
    }
  | {
      /** 登録されていないパスキー。 */
      readonly _tag: "UnknownCredential";
      /** 届いた資格情報の ID。 */
      readonly passkeyId: string;
    }
  | {
      /** 形か検証の手順に合わない資格情報。 */
      readonly _tag: "InvalidCredential";
      /** 受け付けなかった理由。 */
      readonly problem: string;
    };

/** ログインの検証に要る値。 */
export type LoginVerification = {
  /** Drizzle で問い合わせる DB。 */
  readonly db: DatabaseExecutor;
  /** 出した challenge の表。 */
  readonly challenges: ChallengeStore;
  /** 管理画面の origin と RP ID。 */
  readonly relyingParty: RelyingParty;
  /** 届いた資格情報。 */
  readonly credential: AuthenticationCredentialInput;
  /** challenge を出した用途。 */
  readonly purpose: ChallengePurpose;
  /** 届いた日時。 */
  readonly now: Date;
};

const equalBytes = (left: Uint8Array, right: Uint8Array): boolean =>
  left.length === right.length &&
  left.every((byte, index) => byte === right[index]);

/** ログインか再認証の資格情報の challenge を取り出し、保存した公開鍵で検証する。 */
export const verifyLogin = async ({
  challenges,
  credential,
  db,
  now,
  purpose,
  relyingParty,
}: LoginVerification): Promise<VerifiedLogin | LoginFailure> => {
  const decoded = decodeAuthenticationCredential(credential);
  const clientData = parseClientData(decoded.response.clientDataJSON);

  if (clientData._tag === "Rejected") {
    return { _tag: "InvalidCredential", problem: clientData.problem };
  }

  const taken = challenges.take(clientData.challenge, { purpose, now });

  if (taken._tag === "Missing") {
    return { _tag: "ChallengeExpired" };
  }

  const stored = await findLoginPasskey(db, decoded.id);

  if (stored === undefined) {
    return { _tag: "UnknownCredential", passkeyId: decoded.id };
  }

  if (!equalBytes(stored.userHandle, decoded.userHandle)) {
    return {
      _tag: "InvalidCredential",
      problem: "userHandle が、パスキーの持ち主の user handle と違う",
    };
  }

  const verified = await verifyAuthentication(decoded.response, {
    challenge: taken.challenge,
    origin: relyingParty.origin,
    rpId: relyingParty.rpId,
    requireUserVerification: true,
    publicKey: stored.publicKey,
    algorithm: stored.algorithm,
    signCount: stored.signCount,
    backupEligible: stored.backupEligible,
  });

  return verified._tag === "Rejected"
    ? { _tag: "InvalidCredential", problem: verified.problem }
    : {
        _tag: "Verified",
        passkey: stored,
        signCount: verified.signCount,
        backedUp: verified.backedUp,
        counterWentBack: verified.counterWentBack,
        backupEligibilityChanged: verified.backupEligibilityChanged,
      };
};
