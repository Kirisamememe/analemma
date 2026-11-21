import { safe } from "@orpc/client";

import { definedCode } from "../../api/defined-code";
import {
  type ReauthenticateDependencies,
  reauthenticate,
} from "../auth/reauthenticate";

/** パスキーを足した結果。 */
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

const RESULTS: Readonly<Record<string, AddPasskeyResult["_tag"]>> = {
  REAUTHENTICATION_FAILED: "ReauthenticationFailed",
  CHALLENGE_EXPIRED: "ChallengeExpired",
  DUPLICATE_CREDENTIAL: "AlreadyRegistered",
  INVALID_CREDENTIAL: "Rejected",
};

const fromError = (error: Error): AddPasskeyResult => {
  const code = definedCode(error);
  const tag = code === undefined ? undefined : RESULTS[code];

  if (tag === undefined) {
    throw error;
  }

  return { _tag: tag };
};

/** 今のパスキーで確かめ直してから、新しいパスキーを作って足す。 */
export const addPasskey = async (
  dependencies: ReauthenticateDependencies,
  name: string,
): Promise<AddPasskeyResult> => {
  const { api, authenticator } = dependencies;
  const confirmation = await reauthenticate(dependencies);

  if (confirmation._tag === "Cancelled") {
    return { _tag: "Cancelled" };
  }

  const answer = await authenticator.register(
    await api.admin.passkeys.registrationOptions(),
  );

  if (answer._tag !== "Answered") {
    return { _tag: answer._tag };
  }

  const [error] = await safe(
    api.admin.passkeys.register({
      name,
      credential: answer.credential,
      assertion: confirmation.assertion,
    }),
  );

  return error === null ? { _tag: "Added" } : fromError(error);
};
