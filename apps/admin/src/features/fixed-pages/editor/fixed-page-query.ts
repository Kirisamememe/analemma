import type { ApiClient } from "@/api/api-types";
import { callApi } from "@/api/call-api";

/** 編集する固定ページの、query のキー。 */
export const fixedPageQueryKey = (id: string) =>
  ["admin", "fixedPages", "get", id] as const;

/** 編集する固定ページを読む(無ければ NOT_FOUND の結果を返す)。 */
export const loadFixedPage = (api: ApiClient, id: string) =>
  callApi(api.admin.fixedPages.get({ id }), ["NOT_FOUND"]);

/** 編集する固定ページを読んだ結果。 */
export type LoadedFixedPage = Awaited<ReturnType<typeof loadFixedPage>>;
