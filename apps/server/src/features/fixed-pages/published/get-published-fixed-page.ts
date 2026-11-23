import { fixedPageContent, type PublishedImageValue } from "@analemma/contract";

import { findContentImages } from "@/features/fixed-pages/published/find-content-images";
import { findPublishedFixedPage } from "@/features/fixed-pages/published/queries/published-fixed-pages.query";
import { toPublishedFixedPage } from "@/features/fixed-pages/published/to-published-fixed-page";
import { readPublishedImages } from "@/features/images/published/queries/published-images.query";
import { toPublishedImage } from "@/features/images/to-image";
import { readKindFields } from "@/features/kinds/read-kind-fields";
import { publicProcedures } from "@/procedures";

/** 公開している固定ページを、種類と slug で返す procedure。 */
export const getPublishedFixedPage = publicProcedures.fixedPages.get.handler(
  async ({ context, errors, input }) => {
    const row = await findPublishedFixedPage(context.db, input);

    if (row === undefined) {
      throw errors.NOT_FOUND();
    }

    const content = fixedPageContent.parse(row.page.content);

    const references = findContentImages(readKindFields(row.fields), content);

    if (references.length > 0) {
      const byId = Map.groupBy(references, ({ id }) => id);
      const rows = await readPublishedImages(context.db, [...byId.keys()]);
      const imageRows = Map.groupBy(rows, ({ image }) => image.id);

      for (const [id, locations] of byId) {
        const image = toPublishedImage(
          imageRows.get(id) ?? [],
          context.relyingParty.origin,
        );

        const value: PublishedImageValue =
          image === undefined
            ? { available: false }
            : { available: true, image };

        for (const { parent, key } of locations) parent[key] = value;
      }
    }

    return toPublishedFixedPage(row.page, content);
  },
);
