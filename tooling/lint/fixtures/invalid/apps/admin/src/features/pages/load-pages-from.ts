import type { AppContext } from "@/api/app-context";

/** 固定ページの一覧を読む。 */
export const loadPagesFrom = ({ api: client }: AppContext) =>
  client.admin.fixedPages.list();
