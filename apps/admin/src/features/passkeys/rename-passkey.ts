import type { ApiClient } from "../../api/api-types";
import { callApi } from "../../api/call-api";

/** パスキーの名前を変更するときに渡す値。 */
export type RenamePasskeyInput = {
  /** パスキーの ID。 */
  readonly id: string;
  /** 新しい名前。 */
  readonly name: string;
};

/** パスキーの名前を変更した結果。 */
export type RenamePasskeyResult = {
  /** 結果の種類。 */
  readonly _tag: "Renamed" | "NotFound";
};

/** パスキーの名前を変更する(再認証は要らない)。 */
export const renamePasskey = async (
  api: ApiClient,
  input: RenamePasskeyInput,
): Promise<RenamePasskeyResult> => {
  const result = await callApi(api.admin.passkeys.rename(input), ["NOT_FOUND"]);

  return { _tag: result._tag === "Succeeded" ? "Renamed" : "NotFound" };
};
