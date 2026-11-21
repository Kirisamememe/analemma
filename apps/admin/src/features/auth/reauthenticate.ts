import type { ApiClient } from "../../api/api-types";
import type { Authenticator } from "./webauthn/create-authenticator";
import type { AuthenticationCredential } from "./webauthn/to-credentials";

/** 再認証に使うもの。 */
export type ReauthenticateDependencies = {
  /** server の API。 */
  readonly api: ApiClient;
  /** パスキーで確かめる認証器。 */
  readonly authenticator: Authenticator;
  /** 今の時刻(ミリ秒)を返す関数。 */
  readonly now?: () => number;
};

/** 今のパスキーで確かめ直せたこと。 */
type Confirmed = {
  /** 結果の種類。 */
  readonly _tag: "Confirmed";
  /** 操作と一緒に送る、再認証の資格情報。 */
  readonly assertion: AuthenticationCredential;
  /** 再認証の challenge が切れる時刻(ミリ秒)。 */
  readonly expiresAt: number;
};

/** 認証器で取り消したこと。 */
type Cancelled = {
  /** 結果の種類。 */
  readonly _tag: "Cancelled";
};

/** 再認証の結果。 */
export type ReauthenticationResult = Confirmed | Cancelled;

/** 今のパスキーで確かめ直し、操作と一緒に送る資格情報を得る。 */
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
