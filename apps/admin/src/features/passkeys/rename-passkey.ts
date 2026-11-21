import { safe } from "@orpc/client";

import type { ApiClient } from "../../api/api-types";
import { definedCode } from "../../api/defined-code";

/** パスキーの名前を変えるときに渡す値。 */
export type RenamePasskeyInput = {
  /** パスキーの ID。 */
  readonly id: string;
  /** 新しい名前。 */
  readonly name: string;
};

/** パスキーの名前を変えた結果。 */
export type RenamePasskeyResult = {
  /** 結果の種類。 */
  readonly _tag: "Renamed" | "NotFound";
};

/** パスキーの名前を変える(再認証は要らない)。 */
export const renamePasskey = async (
  api: ApiClient,
  input: RenamePasskeyInput,
): Promise<RenamePasskeyResult> => {
  const [error] = await safe(api.admin.passkeys.rename(input));

  if (error === null) {
    return { _tag: "Renamed" };
  }

  if (definedCode(error) === "NOT_FOUND") {
    return { _tag: "NotFound" };
  }

  throw error;
};
