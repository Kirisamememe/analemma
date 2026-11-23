import type { ApiClient } from "@/api/api-types";
import { callApi } from "@/api/call-api";

/** 固定ページを削除した結果。 */
export type DeleteFixedPageResult = {
  /** どの結果か。 */
  readonly _tag: "Deleted" | "NotFound";
};

/** 固定ページを削除する。 */
export const deleteFixedPage = async (
  api: ApiClient,
  id: string,
): Promise<DeleteFixedPageResult> => {
  const result = await callApi(api.admin.fixedPages.delete({ id }), [
    "NOT_FOUND",
  ]);

  return { _tag: result._tag === "Succeeded" ? "Deleted" : "NotFound" };
};
