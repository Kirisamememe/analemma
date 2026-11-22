import { isDefinedError, safe } from "@orpc/client";

import type { ApiClient } from "../../api/api-types";
import type { Authenticator } from "./webauthn/create-authenticator";

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

  const [error] = await safe(api.auth.login.verify(answer.credential));

  if (error === null) {
    return { _tag: "LoggedIn" };
  }

  if (!isDefinedError(error) || error.code === "FORBIDDEN") {
    throw error;
  }

  switch (error.code) {
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
