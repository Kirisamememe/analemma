import { z } from "zod";

import { adminAccess } from "../access-errors";
import { imageTagId, imageTagSummary } from "./image-tag-values";
import { deliveryImage } from "./image-values";

const existing = adminAccess.errors({ NOT_FOUND: { status: 404 } });
const nameTaken = { NAME_TAKEN: { status: 409 } };

/** 管理画面で画像のタグを扱う procedure の contract。 */
export const imageTags = {
  list: adminAccess
    .route({
      method: "GET",
      path: "/admin/image-tags",
      summary: "管理画面の並び順で画像のタグを返す",
    })
    .output(
      z.object({
        tags: z.array(
          imageTagSummary.extend({
            imageCount: z
              .int()
              .nonnegative()
              .describe("このタグを付けた画像の総数。"),
            thumbnailUrls: z
              .array(deliveryImage.shape.url)
              .max(2)
              .describe("このタグを付けた画像のサムネイル。新しく追加した順。"),
          }),
        ),
      }),
    ),
  create: adminAccess
    .errors(nameTaken)
    .route({
      method: "POST",
      path: "/admin/image-tags",
      summary: "画像のタグを作る",
    })
    .input(imageTagSummary.pick({ name: true }))
    .output(imageTagSummary),
  rename: existing
    .errors(nameTaken)
    .route({
      method: "POST",
      path: "/admin/image-tags/rename",
      summary: "画像のタグの名前を変える",
    })
    .input(imageTagSummary)
    .output(imageTagSummary),
  reorder: adminAccess
    .errors({ ORDER_MISMATCH: { status: 409 } })
    .route({
      method: "POST",
      path: "/admin/image-tags/reorder",
      summary: "すべての画像タグを指定した順に並べ直す",
    })
    .input(z.object({ tagIds: z.array(imageTagId) }))
    .output(z.void()),
  delete: existing
    .errors({ TAG_IN_USE: { status: 409 } })
    .route({
      method: "POST",
      path: "/admin/image-tags/delete",
      summary: "画像に付いていないタグを消す",
    })
    .input(imageTagSummary.pick({ id: true }))
    .output(z.void()),
};
