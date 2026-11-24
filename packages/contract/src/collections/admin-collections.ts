import { z } from "zod";

import { adminAccess } from "../access-errors";
import { adminImage, imageId } from "../images/image-values";
import { collectionFields } from "./collection-values";

const byId = z.object({ id: z.uuid().describe("作品集の ID。") });

const metadata = collectionFields.extend({
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

/** 管理画面で作品集を扱う procedure の contract。 */
export const collections = {
  list: adminAccess
    .route({
      method: "GET",
      path: "/admin/collections",
      summary: "作品集の一覧(新しく作った順)",
    })
    .output(z.object({ collections: z.array(summary) })),
  get: existing
    .route({
      method: "GET",
      path: "/admin/collections/{id}",
      summary: "作品集と並び順どおりの画像",
    })
    .input(byId)
    .output(metadata.extend({ images: z.array(adminImage) })),
  create: adminAccess
    .errors(slugTaken)
    .route({
      method: "POST",
      path: "/admin/collections",
      summary: "作品集を作る",
    })
    .input(collectionFields)
    .output(metadata),
  update: existing
    .errors(slugTaken)
    .route({
      method: "POST",
      path: "/admin/collections/update",
      summary: "作品集の名前・slug・説明を書き換える",
    })
    .input(byId.extend(collectionFields.shape))
    .output(metadata),
  delete: existing
    .route({
      method: "POST",
      path: "/admin/collections/delete",
      summary: "作品集を消す",
    })
    .input(byId)
    .output(z.void()),
  publish: existing
    .route({
      method: "POST",
      path: "/admin/collections/publish",
      summary: "作品集を公開する",
    })
    .input(byId)
    .output(metadata),
  unpublish: existing
    .route({
      method: "POST",
      path: "/admin/collections/unpublish",
      summary: "作品集を非公開に戻す",
    })
    .input(byId)
    .output(metadata),
  addImages: existing
    .route({
      method: "POST",
      path: "/admin/collections/add-images",
      summary: "作品集の末尾に画像を足す",
    })
    .input(withImages)
    .output(z.void()),
  removeImages: existing
    .route({
      method: "POST",
      path: "/admin/collections/remove-images",
      summary: "作品集から画像を外す",
    })
    .input(withImages)
    .output(z.void()),
  reorder: existing
    .errors({ ORDER_MISMATCH: { status: 409 } })
    .route({
      method: "POST",
      path: "/admin/collections/reorder",
      summary: "作品集のすべての画像を渡した順に並べ直す",
    })
    .input(withImages)
    .output(z.void()),
};
