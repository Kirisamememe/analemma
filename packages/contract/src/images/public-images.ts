import { oc } from "@orpc/contract";
import { z } from "zod";

import { imageId, publishedImage } from "./image-values";

/** 公開サイトが画像を読む procedure の contract。 */
export const publicImages = {
  get: oc
    .errors({ NOT_FOUND: { status: 404 } })
    .route({
      method: "GET",
      path: "/images/{id}",
      summary: "公開している画像(無ければ NOT_FOUND)",
    })
    .input(z.object({ id: imageId }))
    .output(publishedImage),
};
