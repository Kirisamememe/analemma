import type { ApiClient } from "@/api/api-types";
import { callApi } from "@/api/call-api";

/** デプロイ用のトークンを取り消した結果。 */
export type RevokeDeployTokenResult = {
  /** どの結果か。 */
  readonly _tag: "Revoked" | "NotFound";
};

/** デプロイ用のトークンを取り消す(再認証は要らない)。 */
export const revokeDeployToken = async (
  api: ApiClient,
  id: string,
): Promise<RevokeDeployTokenResult> => {
  const result = await callApi(api.admin.deployTokens.revoke({ id }), [
    "NOT_FOUND",
  ]);

  return { _tag: result._tag === "Succeeded" ? "Revoked" : "NotFound" };
};
