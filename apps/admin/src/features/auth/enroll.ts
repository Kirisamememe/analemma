import { ORPCError, safe } from "@orpc/client";

import type { ApiClient } from "../../api/api-types";
import type { Authenticator } from "./webauthn/create-authenticator";

/** 登録用 URL からの登録に使うもの。 */
export type EnrollDependencies = {
  /** server の API。 */
  readonly api: ApiClient;
  /** パスキーを作る認証器。 */
  readonly authenticator: Authenticator;
};

/** 登録用 URL からの登録に渡す値。 */
export type EnrollInput = {
  /** 登録用 URL の `#` の後ろの token。 */
  readonly token: string;
  /** パスキーに付ける名前。 */
  readonly name: string;
};

/** 登録用 URL からの登録の結果。 */
export type EnrollResult = {
  /** 結果の種類。 */
  readonly _tag:
    | "Enrolled"
    | "Cancelled"
    | "InvalidEnrollment"
    | "ChallengeExpired"
    | "AlreadyRegistered"
    | "Rejected";
};

const fromError = (error: Error): EnrollResult => {
  if (!(error instanceof ORPCError) || !error.defined) {
    throw error;
  }

  switch (error.code) {
    case "INVALID_ENROLLMENT": {
      return { _tag: "InvalidEnrollment" };
    }
    case "CHALLENGE_EXPIRED": {
      return { _tag: "ChallengeExpired" };
    }
    case "DUPLICATE_CREDENTIAL": {
      return { _tag: "AlreadyRegistered" };
    }
    case "INVALID_CREDENTIAL": {
      return { _tag: "Rejected" };
    }
    default: {
      throw error;
    }
  }
};

/** 登録用 URL の token で、新しいパスキーを登録してログインする。 */
export const enroll = async (
  { api, authenticator }: EnrollDependencies,
  { token, name }: EnrollInput,
): Promise<EnrollResult> => {
  const [optionsError, options] = await safe(
    api.auth.enrollment.options({ token }),
  );

  if (optionsError !== null) {
    return fromError(optionsError);
  }

  const answer = await authenticator.register(options);

  if (answer._tag !== "Answered") {
    return { _tag: answer._tag };
  }

  const [error] = await safe(
    api.auth.enrollment.register({
      token,
      name,
      credential: answer.credential,
    }),
  );

  return error === null ? { _tag: "Enrolled" } : fromError(error);
};
