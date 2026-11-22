import { callApi } from "@/api/call-api";
import {
  type ReauthenticateDependencies,
  reauthenticate,
} from "@/features/auth/reauthenticate";

/** パスキーを削除した結果。 */
export type DeletePasskeyResult = {
  /** 結果の種類。 */
  readonly _tag:
    | "Deleted"
    | "Cancelled"
    | "ReauthenticationFailed"
    | "LastPasskey"
    | "NotFound";
};

const RESULTS = {
  REAUTHENTICATION_FAILED: "ReauthenticationFailed",
  LAST_PASSKEY: "LastPasskey",
  NOT_FOUND: "NotFound",
} satisfies Record<string, DeletePasskeyResult["_tag"]>;

/** 再認証をしてから、パスキーを削除する。 */
export const deletePasskey = async (
  dependencies: ReauthenticateDependencies,
  id: string,
): Promise<DeletePasskeyResult> => {
  const confirmation = await reauthenticate(dependencies);

  if (confirmation._tag === "Cancelled") {
    return { _tag: "Cancelled" };
  }

  const result = await callApi(
    dependencies.api.admin.passkeys.delete({
      id,
      assertion: confirmation.assertion,
    }),
    ["REAUTHENTICATION_FAILED", "LAST_PASSKEY", "NOT_FOUND"],
  );

  return {
    _tag: result._tag === "Succeeded" ? "Deleted" : RESULTS[result.code],
  };
};
