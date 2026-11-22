import { listPublishedFixedPages as listPublishedRows } from "@/features/fixed-pages/published/published-fixed-pages.query";
import { toPublishedSummary } from "@/features/fixed-pages/published/to-published-fixed-page";
import { publicProcedures } from "@/procedures";

/** 公開している固定ページの一覧を、並び順に返す procedure。 */
export const listPublishedFixedPages = publicProcedures.fixedPages.list.handler(
  async ({ context, input }) => ({
    pages: (await listPublishedRows(context.db, input.kind)).map((row) =>
      toPublishedSummary(row),
    ),
  }),
);
