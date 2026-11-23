import type { ApiClient } from "@/api/api-types";
import { callApi } from "@/api/call-api";

/** 公開状態を変えた結果。 */
export type PublicationResult = {
  /** どの結果か。 */
  readonly _tag: "Published" | "Unpublished" | "NotFound";
};

/** 固定ページを削除した結果。 */
export type DeleteFixedPageResult = {
  /** どの結果か。 */
  readonly _tag: "Deleted" | "NotFound";
};

/** 公開状態の変え方。 */
export type PublicationChange = {
  /** 固定ページの ID。 */
  readonly id: string;
  /** 公開するか(`false` なら非公開に戻す)。 */
  readonly published: boolean;
};

/** 固定ページを並べ直した結果。 */
export type ReorderFixedPagesResult = {
  /** どの結果か。 */
  readonly _tag: "Reordered" | "OrderMismatch";
};

/** 固定ページを公開するか、非公開に戻す。 */
export const setPublication = async (
  api: ApiClient,
  { id, published }: PublicationChange,
): Promise<PublicationResult> => {
  const result = await callApi(
    published
      ? api.admin.fixedPages.publish({ id })
      : api.admin.fixedPages.unpublish({ id }),
    ["NOT_FOUND"],
  );

  if (result._tag === "Failed") {
    return { _tag: "NotFound" };
  }

  return { _tag: result.data.published ? "Published" : "Unpublished" };
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

/** すべての固定ページの ID を、並べたい順に送る。 */
export const reorderFixedPages = async (
  api: ApiClient,
  ids: readonly string[],
): Promise<ReorderFixedPagesResult> => {
  const result = await callApi(
    api.admin.fixedPages.reorder({ ids: [...ids] }),
    ["ORDER_MISMATCH"],
  );

  return { _tag: result._tag === "Succeeded" ? "Reordered" : "OrderMismatch" };
};
