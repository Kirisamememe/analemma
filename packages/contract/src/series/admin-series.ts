import { z } from "zod";

import { adminAccess } from "../access-errors";
import { adminImage, imageId } from "../images/image-values";
import { seriesFields } from "./series-values";

const byId = z.object({ id: z.uuid().describe("シリーズの ID。") });

const metadata = seriesFields.extend({
  ...byId.shape,
  published: z.boolean().describe("公開しているか。"),
  publishedAt: z.iso
    .datetime({ offset: true })
    .nullable()
    .describe("公開した日時。公開していなければ null。"),
});

const summary = metadata.extend({
  imageCount: z.int().nonnegative(),
  coverImage: adminImage.nullable(),
});

const withImages = byId.extend({ imageIds: z.array(imageId) });
const existing = adminAccess.errors({ NOT_FOUND: { status: 404 } });
const slugTaken = { SLUG_TAKEN: { status: 409 } };

/** 管理画面でシリーズを扱う procedure の contract。 */
export const series = {
  list: adminAccess
    .route({
      method: "GET",
      path: "/admin/series",
      summary: "シリーズの一覧(新しく作った順)",
    })
    .output(z.object({ series: z.array(summary) })),
  get: existing
    .route({
      method: "GET",
      path: "/admin/series/{id}",
      summary: "シリーズと並び順どおりの画像",
    })
    .input(byId)
    .output(metadata.extend({ images: z.array(adminImage) })),
  create: adminAccess
    .errors(slugTaken)
    .route({ method: "POST", path: "/admin/series", summary: "シリーズを作る" })
    .input(seriesFields)
    .output(metadata),
  update: existing
    .errors(slugTaken)
    .route({
      method: "POST",
      path: "/admin/series/update",
      summary: "シリーズの名前・slug・説明を書き換える",
    })
    .input(byId.extend(seriesFields.shape))
    .output(metadata),
  delete: existing
    .route({
      method: "POST",
      path: "/admin/series/delete",
      summary: "シリーズを消す",
    })
    .input(byId)
    .output(z.void()),
  publish: existing
    .route({
      method: "POST",
      path: "/admin/series/publish",
      summary: "シリーズを公開する",
    })
    .input(byId)
    .output(metadata),
  unpublish: existing
    .route({
      method: "POST",
      path: "/admin/series/unpublish",
      summary: "シリーズを非公開に戻す",
    })
    .input(byId)
    .output(metadata),
  addImages: existing
    .route({
      method: "POST",
      path: "/admin/series/add-images",
      summary: "シリーズの末尾に画像を足す",
    })
    .input(withImages)
    .output(z.void()),
  removeImages: existing
    .route({
      method: "POST",
      path: "/admin/series/remove-images",
      summary: "シリーズから画像を外す",
    })
    .input(withImages)
    .output(z.void()),
  reorder: existing
    .errors({ ORDER_MISMATCH: { status: 409 } })
    .route({
      method: "POST",
      path: "/admin/series/reorder",
      summary: "シリーズのすべての画像を渡した順に並べ直す",
    })
    .input(withImages)
    .output(z.void()),
};
