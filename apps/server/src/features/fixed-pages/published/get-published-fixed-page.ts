import { findContentImages } from "@/features/fixed-pages/published/find-content-images";
import { findPublishedFixedPage } from "@/features/fixed-pages/published/queries/published-fixed-pages.query";
import { toPublishedFixedPage } from "@/features/fixed-pages/published/to-published-fixed-page";
import { readPublishedImages } from "@/features/images/published/queries/published-images.query";
import { publicProcedures } from "@/procedures";

/** 公開している固定ページを、種類と slug で返す procedure。 */
export const getPublishedFixedPage = publicProcedures.fixedPages.get.handler(
  async ({ context, errors, input }) => {
    const row = await findPublishedFixedPage(context.db, input);

    if (row === undefined) {
      throw errors.NOT_FOUND();
    }

    const references = findContentImages(row.fields, row.page.content);
    const ids = [...new Set(references.map(({ id }) => id))];

    const images =
      ids.length === 0 ? [] : await readPublishedImages(context.db, ids);

    return toPublishedFixedPage(row, {
      images,
      origin: context.relyingParty.origin,
    });
  },
);
