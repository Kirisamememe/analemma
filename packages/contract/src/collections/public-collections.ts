import { oc } from "@orpc/contract";
import { z } from "zod";

import { publishedImage } from "../images/image-values";
import { collectionFields } from "./collection-values";

/** 公開サイトが作品集を読む procedure の contract。 */
export const publicCollections = {
  list: oc
    .route({
      method: "GET",
      path: "/collections",
      summary: "公開している作品集の一覧(新しく作った順)",
    })
    .output(
      z.object({
        collections: z.array(
          collectionFields.extend({
            coverImage: publishedImage.nullable(),
            imageCount: z.int().nonnegative(),
          }),
        ),
      }),
    ),
  get: oc
    .errors({ NOT_FOUND: { status: 404 } })
    .route({
      method: "GET",
      path: "/collections/{slug}",
      summary: "公開している作品集と並び順どおりの公開画像(無ければ NOT_FOUND)",
    })
    .input(collectionFields.pick({ slug: true }))
    .output(collectionFields.extend({ images: z.array(publishedImage) })),
};
