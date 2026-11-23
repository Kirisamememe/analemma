import type { ApiClient, ApiOutputs } from "@/api/api-types";

/** 固定ページの一覧の、query のキー。 */
export const FIXED_PAGES_QUERY_KEY = ["admin", "fixedPages", "list"] as const;

/** 固定ページで使う種類の一覧と定義の query に共通するキー。 */
export const FIXED_PAGE_KINDS_KEY = ["admin", "fixedPages", "kinds"] as const;

/** 固定ページ内で種類の一覧と定義を新しく取り直さずに使う期間(ミリ秒)。 */
export const KIND_STALE_TIME = 15 * 60_000;

/** 種類の一覧の query のキー。 */
export const KINDS_QUERY_KEY = [...FIXED_PAGE_KINDS_KEY, "list"] as const;

/** 名前で取得する種類の定義の query のキー。 */
export const kindQueryKey = (name: string | undefined) =>
  [...FIXED_PAGE_KINDS_KEY, "get", name] as const;

/** 一覧に出す、1つの固定ページ。 */
export type FixedPageSummary =
  ApiOutputs["admin"]["fixedPages"]["list"]["pages"][number];

/** 固定ページの一覧を読む。 */
export const loadFixedPages = (api: ApiClient) => api.admin.fixedPages.list();

/** 種類の一覧を読む。 */
export const loadKinds = (api: ApiClient) => api.admin.kinds.list();
