import type { ApiClient } from "@/api/api-types";
import type {
  AuthenticationCredential,
  Authenticator,
} from "@/features/auth/webauthn";

/** 再認証に使うもの。 */
export type ReauthenticateDependencies = {
  /** server の API。 */
  readonly api: ApiClient;
  /** パスキーで確かめる認証器。 */
  readonly authenticator: Authenticator;
  /** 今の時刻(ミリ秒)を返す関数。 */
  readonly now?: () => number;
  /** 決めた時間(ミリ秒)の後に止まる signal を作る関数。 */
  readonly abortAfter?: (milliseconds: number) => AbortSignal;
};

/** 再認証ができたこと。 */
type Confirmed = {
  /** 結果の種類。 */
  readonly _tag: "Confirmed";
  /** 操作と一緒に送る、再認証の資格情報。 */
  readonly assertion: AuthenticationCredential;
  /** 再認証の challenge が切れる時刻(ミリ秒)。 */
  readonly expiresAt: number;
};

/** 認証器でキャンセルしたこと。 */
type Cancelled = {
  /** 結果の種類。 */
  readonly _tag: "Cancelled";
};

/** 再認証の結果。 */
export type ReauthenticationResult = Confirmed | Cancelled;

/** 再認証をして、操作と一緒に送る資格情報を得る。 */
export const reauthenticate = async ({
  api,
  authenticator,
  now = Date.now,
}: ReauthenticateDependencies): Promise<ReauthenticationResult> => {
  const requestedAt = now();
  const options = await api.admin.session.reauthenticationOptions();
  const answer = await authenticator.authenticate(options);

  return answer._tag === "Answered"
    ? {
        _tag: "Confirmed",
        assertion: answer.credential,
        expiresAt: requestedAt + options.timeout,
      }
    : { _tag: "Cancelled" };
};
