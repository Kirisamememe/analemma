import type { ApiClient as Client } from "@/api/api-types";

/** 固定ページの一覧を読む。 */
export const loadPages = (client: Client) => client.admin.fixedPages.list();
