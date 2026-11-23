import { oc } from "@orpc/contract";
import { z } from "zod";

import { publishedImage } from "../images/image-values";
import { seriesFields } from "./series-values";

/** 公開サイトがシリーズを読む procedure の contract。 */
export const publicSeries = {
  list: oc
    .route({
      method: "GET",
      path: "/series",
      summary: "公開しているシリーズの一覧(新しく作った順)",
    })
    .output(
      z.object({
        series: z.array(
          seriesFields.extend({
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
      path: "/series/{slug}",
      summary:
        "公開しているシリーズと並び順どおりの公開画像(無ければ NOT_FOUND)",
    })
    .input(seriesFields.pick({ slug: true }))
    .output(seriesFields.extend({ images: z.array(publishedImage) })),
};
