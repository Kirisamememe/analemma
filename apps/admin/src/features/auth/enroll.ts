import type { ApiClient } from "@/api/api-types";
import { callApi } from "@/api/call-api";
import type { Authenticator } from "@/features/auth/webauthn/create-authenticator";

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

/** 登録用 URL の token で、新しいパスキーを登録してログインする。 */
export const enroll = async (
  { api, authenticator }: EnrollDependencies,
  { token, name }: EnrollInput,
): Promise<EnrollResult> => {
  const options = await callApi(api.auth.enrollment.options({ token }), [
    "INVALID_ENROLLMENT",
  ]);

  if (options._tag === "Failed") {
    return { _tag: "InvalidEnrollment" };
  }

  const answer = await authenticator.register(options.data);

  if (answer._tag !== "Answered") {
    return { _tag: answer._tag };
  }

  const result = await callApi(
    api.auth.enrollment.register({
      token,
      name,
      credential: answer.credential,
    }),
    [
      "INVALID_ENROLLMENT",
      "CHALLENGE_EXPIRED",
      "DUPLICATE_CREDENTIAL",
      "INVALID_CREDENTIAL",
    ],
  );

  if (result._tag === "Succeeded") {
    return { _tag: "Enrolled" };
  }

  switch (result.code) {
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
  }
};
