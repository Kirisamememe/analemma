import { publicProcedures } from "../../../procedures";
import { listPublishedFixedPages as listPublishedRows } from "./list-published-fixed-pages.query";
import { toPublishedSummary } from "./to-published-fixed-page";

/** 公開している固定ページの一覧を、並び順に返す procedure。 */
export const listPublishedFixedPages = publicProcedures.fixedPages.list.handler(
  async ({ context, input }) => ({
    pages: (await listPublishedRows(context.db, input.kind)).map((row) =>
      toPublishedSummary(row),
    ),
  }),
);
