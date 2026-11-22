import { publicProcedures } from "../../../procedures";
import { findPublishedFixedPage } from "./published-fixed-pages.query";
import { toPublishedFixedPage } from "./to-published-fixed-page";

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
