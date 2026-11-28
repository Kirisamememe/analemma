import { z } from "zod";

import { adminAccess } from "../access-errors";
import {
  imageListCursor,
  imageListFilter,
  imageListOptions,
  imageListPage,
} from "./image-list";
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
      summary: "タグで絞り込み、追加順かタイトル順で読む画像の一覧",
    })
    .input(imageListPage)
    .output(
      z.object({
        images: z.array(adminImage),
        nextCursor: imageListCursor
          .nullable()
          .describe("次のページを読むときの cursor。次が無ければ null。"),
      }),
    ),
  counts: adminAccess
    .route({
      method: "GET",
      path: "/admin/images/counts",
      summary: "画像の総枚数、タグ無しの枚数、タグの条件と状態ごとの枚数",
    })
    .input(imageListFilter)
    .output(
      z.object({
        total: z.int().nonnegative(),
        untagged: z.int().nonnegative(),
        any: z.int().nonnegative(),
        all: z.int().nonnegative(),
        byStatus: z
          .array(
            z.object({
              status: z.enum([
                "published",
                "unpublished",
                "processing",
                "failed",
              ]),
              count: z.int().positive(),
            }),
          )
          .describe("絞り込み結果にある状態。変換の失敗はまとめる。"),
      }),
    ),
  browseNeighbors: adminAccess
    .errors({ NOT_FOUND: { status: 404 } })
    .route({
      method: "GET",
      path: "/admin/images/{id}/browse-neighbors",
      summary: "一覧の絞り込みと並び順に従って前後の画像の ID を返す",
    })
    .input(imageListOptions.extend({ id: imageId }))
    .output(
      z.object({
        previous: imageId
          .nullable()
          .describe("一覧で一つ手前の画像の ID。追加順では一つ新しい画像。"),
        next: imageId
          .nullable()
          .describe("一覧で一つ先の画像の ID。追加順では一つ古い画像。"),
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
        "写真1枚を受け取り、撮影の情報を持つ、変換を待つ画像を作る(変換を終えると公開になる)",
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
    .errors({
      NOT_FOUND: { status: 404 },
      NOT_CONVERTED: { status: 409 },
    })
    .route({
      method: "POST",
      path: "/admin/images/publish",
      summary: "画像を公開する",
    })
    .input(byId)
    .output(adminImage),
  unpublish: adminAccess
    .errors({
      NOT_FOUND: { status: 404 },
      NOT_CONVERTED: { status: 409 },
    })
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
