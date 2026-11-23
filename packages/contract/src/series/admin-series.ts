import { z } from "zod";

import { adminAccess } from "../access-errors";
import { fixedPageSlug } from "../fixed-pages/fixed-page-values";
import {
  adminImage,
  imageDescription,
  imageTitle,
} from "../images/image-values";

const byId = z.object({ id: z.uuid().describe("シリーズの ID。") });

const fields = z.object({
  name: imageTitle.describe("シリーズの名前。"),
  slug: fixedPageSlug.describe("シリーズの slug。"),
  description: imageDescription
    .nullable()
    .describe("シリーズの説明。無ければ null。"),
});

const metadata = fields.extend({
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
    .input(fields)
    .output(metadata),
  update: existing
    .errors(slugTaken)
    .route({
      method: "POST",
      path: "/admin/series/update",
      summary: "シリーズの名前・slug・説明を書き換える",
    })
    .input(byId.extend(fields.shape))
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
};
