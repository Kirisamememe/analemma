import type { ApiClient } from "@/api/api-types";

/** 固定ページの一覧を読む。 */
export const loadPages = (api: ApiClient) => api.admin.fixedPages.list();
