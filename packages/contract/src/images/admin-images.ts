import { z } from "zod";

import { adminAccess } from "../access-errors";
import { adminImage, imageId } from "./image-values";

const byId = z.object({ id: imageId });

/** 管理画面で画像を扱う procedure の contract。 */
export const images = {
  list: adminAccess
    .route({
      method: "GET",
      path: "/admin/images",
      summary: "画像の一覧(新しく足した順)",
    })
    .input(
      z.object({
        cursor: imageId
          .optional()
          .describe("前のページの nextCursor。省くと最初のページ。"),
        limit: z.int().min(1).max(100).default(50).describe("1ページの件数。"),
      }),
    )
    .output(
      z.object({
        images: z.array(adminImage),
        nextCursor: imageId
          .nullable()
          .describe("次のページを読むときの cursor。次が無ければ null。"),
      }),
    ),
  get: adminAccess
    .errors({ NOT_FOUND: { status: 404 } })
    .route({
      method: "GET",
      path: "/admin/images/{id}",
      summary: "画像",
    })
    .input(byId)
    .output(adminImage),
};
