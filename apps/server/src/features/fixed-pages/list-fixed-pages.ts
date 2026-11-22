import { adminProcedures } from "../../procedures";
import { listFixedPages as listFixedPageRows } from "./fixed-pages.query";
import { toFixedPageSummary } from "./to-fixed-page-detail";

/** すべての固定ページを、並び順に返す procedure。 */
export const listFixedPages = adminProcedures.fixedPages.list.handler(
  async ({ context }) => ({
    pages: (await listFixedPageRows(context.db)).map((row) =>
      toFixedPageSummary(row),
    ),
  }),
);
