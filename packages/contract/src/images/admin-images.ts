import { z } from "zod";

import { adminAccess } from "../access-errors";
import {
  adminImage,
  imageAlt,
  imageDescription,
  imageId,
  imageTitle,
  photoFile,
} from "./image-values";

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
  upload: adminAccess
    .errors({ UNSUPPORTED_FORMAT: { status: 415 } })
    .route({
      method: "POST",
      path: "/admin/images/upload",
      summary:
        "写真1枚から、撮影の情報と配信用の画像を持つ画像を作る(公開する)",
    })
    .input(z.object({ photo: photoFile }))
    .output(adminImage),
  neighbors: adminAccess
    .errors({ NOT_FOUND: { status: 404 } })
    .route({
      method: "GET",
      path: "/admin/images/{id}/neighbors",
      summary: "一覧の並び(新しく足した順)で、画像の前後の画像の ID",
    })
    .input(byId)
    .output(
      z.object({
        newer: imageId
          .nullable()
          .describe("一つ新しく足した画像の ID。無ければ null。"),
        older: imageId
          .nullable()
          .describe("一つ古く足した画像の ID。無ければ null。"),
      }),
    ),
  update: adminAccess
    .errors({ NOT_FOUND: { status: 404 } })
    .route({
      method: "POST",
      path: "/admin/images/update",
      summary: "画像のタイトル・説明・alt を書き換える",
    })
    .input(
      byId.extend({
        title: imageTitle.nullable(),
        description: imageDescription.nullable(),
        alt: imageAlt.nullable(),
      }),
    )
    .output(adminImage),
  publish: adminAccess
    .errors({ NOT_FOUND: { status: 404 } })
    .route({
      method: "POST",
      path: "/admin/images/publish",
      summary: "画像を公開する",
    })
    .input(byId)
    .output(adminImage),
  unpublish: adminAccess
    .errors({ NOT_FOUND: { status: 404 } })
    .route({
      method: "POST",
      path: "/admin/images/unpublish",
      summary: "画像を非公開にする",
    })
    .input(byId)
    .output(adminImage),
  delete: adminAccess
    .errors({ NOT_FOUND: { status: 404 } })
    .route({
      method: "POST",
      path: "/admin/images/delete",
      summary: "画像を消す",
    })
    .input(byId)
    .output(z.void()),
};
