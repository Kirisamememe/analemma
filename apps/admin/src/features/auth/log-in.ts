import type { ApiClient } from "@/api/api-types";
import { callApi } from "@/api/call-api";
import type { Authenticator } from "@/features/auth/webauthn/create-authenticator";

/** ログインに使うもの。 */
export type LogInDependencies = {
  /** server の API。 */
  readonly api: ApiClient;
  /** パスキーで確かめる認証器。 */
  readonly authenticator: Authenticator;
};

/** ログインの結果。 */
export type LogInResult = {
  /** 結果の種類。 */
  readonly _tag:
    | "LoggedIn"
    | "Cancelled"
    | "ChallengeExpired"
    | "UnknownPasskey"
    | "Rejected";
};

/** パスキーでログインする(options を取り、認証器に尋ね、server に確かめさせる)。 */
export const logIn = async ({
  api,
  authenticator,
}: LogInDependencies): Promise<LogInResult> => {
  const answer = await authenticator.authenticate(
    await api.auth.login.options(),
  );

  if (answer._tag !== "Answered") {
    return { _tag: "Cancelled" };
  }

  const result = await callApi(api.auth.login.verify(answer.credential), [
    "CHALLENGE_EXPIRED",
    "UNKNOWN_CREDENTIAL",
    "INVALID_CREDENTIAL",
  ]);

  if (result._tag === "Succeeded") {
    return { _tag: "LoggedIn" };
  }

  switch (result.code) {
    case "CHALLENGE_EXPIRED": {
      return { _tag: "ChallengeExpired" };
    }
    case "UNKNOWN_CREDENTIAL": {
      return { _tag: "UnknownPasskey" };
    }
    case "INVALID_CREDENTIAL": {
      return { _tag: "Rejected" };
    }
  }
};
