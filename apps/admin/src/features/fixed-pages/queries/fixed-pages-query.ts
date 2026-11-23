import type { ApiClient, ApiOutputs } from "@/api/api-types";

/** 固定ページの一覧の、query のキー。 */
export const FIXED_PAGES_QUERY_KEY = ["admin", "fixedPages", "list"] as const;

/** 種類の一覧の、query のキー。 */
export const KINDS_QUERY_KEY = ["admin", "kinds", "list"] as const;

/** 一覧に出す、1つの固定ページ。 */
export type FixedPageSummary =
  ApiOutputs["admin"]["fixedPages"]["list"]["pages"][number];

/** 固定ページの一覧を読む。 */
export const loadFixedPages = (api: ApiClient) => api.admin.fixedPages.list();

/** 種類の一覧を読む。 */
export const loadKinds = (api: ApiClient) => api.admin.kinds.list();
