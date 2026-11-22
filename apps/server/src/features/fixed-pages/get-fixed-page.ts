import { findFixedPage } from "@/features/fixed-pages/queries/fixed-pages.query";
import { toFixedPageDetail } from "@/features/fixed-pages/to-fixed-page-detail";
import { adminProcedures } from "@/procedures";

/** 公開しているかによらず、中身を含む固定ページを返す procedure。 */
export const getFixedPage = adminProcedures.fixedPages.get.handler(
  async ({ context, errors, input }) => {
    const row = await findFixedPage(context.db, input.id);

    if (row === undefined) {
      throw errors.NOT_FOUND();
    }

    return toFixedPageDetail(row);
  },
);
