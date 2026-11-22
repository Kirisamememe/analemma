import { listFixedPages as listFixedPageRows } from "@/features/fixed-pages/queries/fixed-pages.query";
import { toFixedPageSummary } from "@/features/fixed-pages/to-fixed-page-detail";
import { adminProcedures } from "@/procedures";

/** すべての固定ページを、並び順に返す procedure。 */
export const listFixedPages = adminProcedures.fixedPages.list.handler(
  async ({ context }) => ({
    pages: (await listFixedPageRows(context.db)).map((row) =>
      toFixedPageSummary(row),
    ),
  }),
);
