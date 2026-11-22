import { callApi } from "../../api/call-api";
import {
  type ReauthenticateDependencies,
  reauthenticate,
} from "../auth/reauthenticate";

/** パスキーを追加した結果。 */
export type AddPasskeyResult = {
  /** 結果の種類。 */
  readonly _tag:
    | "Added"
    | "Cancelled"
    | "ReauthenticationFailed"
    | "ChallengeExpired"
    | "AlreadyRegistered"
    | "Rejected";
};

const RESULTS = {
  REAUTHENTICATION_FAILED: "ReauthenticationFailed",
  CHALLENGE_EXPIRED: "ChallengeExpired",
  DUPLICATE_CREDENTIAL: "AlreadyRegistered",
  INVALID_CREDENTIAL: "Rejected",
} satisfies Record<string, AddPasskeyResult["_tag"]>;

const SERVER_MARGIN_MS = 10_000;
const MINIMUM_CREATION_MS = 30_000;

/** 再認証をしてから、新しいパスキーを作って追加する。 */
export const addPasskey = async (
  dependencies: ReauthenticateDependencies,
  name: string,
): Promise<AddPasskeyResult> => {
  const {
    api,
    authenticator,
    now = Date.now,
    abortAfter = (milliseconds: number) => AbortSignal.timeout(milliseconds),
  } = dependencies;
  const confirmation = await reauthenticate(dependencies);

  if (confirmation._tag === "Cancelled") {
    return { _tag: "Cancelled" };
  }

  const options = await api.admin.passkeys.registrationOptions();
  const remaining = confirmation.expiresAt - now() - SERVER_MARGIN_MS;

  if (remaining < MINIMUM_CREATION_MS) {
    return { _tag: "ChallengeExpired" };
  }

  const deadline = abortAfter(remaining);
  const answer = await authenticator.register(
    { ...options, timeout: Math.min(options.timeout, remaining) },
    deadline,
  );

  if (answer._tag !== "Answered") {
    return { _tag: deadline.aborted ? "ChallengeExpired" : answer._tag };
  }

  const result = await callApi(
    api.admin.passkeys.register({
      name,
      credential: answer.credential,
      assertion: confirmation.assertion,
    }),
    [
      "REAUTHENTICATION_FAILED",
      "CHALLENGE_EXPIRED",
      "DUPLICATE_CREDENTIAL",
      "INVALID_CREDENTIAL",
    ],
  );

  return {
    _tag: result._tag === "Succeeded" ? "Added" : RESULTS[result.code],
  };
};
