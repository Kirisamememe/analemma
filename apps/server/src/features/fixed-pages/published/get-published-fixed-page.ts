import { findPublishedFixedPage } from "@/features/fixed-pages/published/queries/published-fixed-pages.query";
import { toPublishedFixedPage } from "@/features/fixed-pages/published/to-published-fixed-page";
import { publicProcedures } from "@/procedures";

/** 公開している固定ページを、種類と slug で返す procedure。 */
export const getPublishedFixedPage = publicProcedures.fixedPages.get.handler(
  async ({ context, errors, input }) => {
    const row = await findPublishedFixedPage(context.db, input);

    if (row === undefined) {
      throw errors.NOT_FOUND();
    }

    return toPublishedFixedPage(row);
  },
);
