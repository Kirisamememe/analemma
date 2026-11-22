import { adminProcedures } from "../../procedures";
import { findFixedPage } from "./fixed-pages.query";
import { toFixedPageDetail } from "./to-fixed-page-detail";

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
