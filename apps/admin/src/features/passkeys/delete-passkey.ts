import { safe } from "@orpc/client";

import { definedCode } from "../../api/defined-code";
import {
  type ReauthenticateDependencies,
  reauthenticate,
} from "../auth/reauthenticate";

/** パスキーを消した結果。 */
export type DeletePasskeyResult = {
  /** 結果の種類。 */
  readonly _tag:
    | "Deleted"
    | "Cancelled"
    | "ReauthenticationFailed"
    | "LastPasskey"
    | "NotFound";
};

const RESULTS: Readonly<Record<string, DeletePasskeyResult["_tag"]>> = {
  REAUTHENTICATION_FAILED: "ReauthenticationFailed",
  LAST_PASSKEY: "LastPasskey",
  NOT_FOUND: "NotFound",
};

const fromError = (error: Error): DeletePasskeyResult => {
  const code = definedCode(error);
  const tag = code === undefined ? undefined : RESULTS[code];

  if (tag === undefined) {
    throw error;
  }

  return { _tag: tag };
};

/** 今のパスキーで確かめ直してから、パスキーを消す。 */
export const deletePasskey = async (
  dependencies: ReauthenticateDependencies,
  id: string,
): Promise<DeletePasskeyResult> => {
  const confirmation = await reauthenticate(dependencies);

  if (confirmation._tag === "Cancelled") {
    return { _tag: "Cancelled" };
  }

  const [error] = await safe(
    dependencies.api.admin.passkeys.delete({
      id,
      assertion: confirmation.assertion,
    }),
  );

  return error === null ? { _tag: "Deleted" } : fromError(error);
};
