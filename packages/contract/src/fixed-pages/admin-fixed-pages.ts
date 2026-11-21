import { z } from "zod";

import { adminAccess } from "../access-errors";
import { contentIssues } from "../kinds/content-issues";
import { kindName } from "../kinds/kind-definition";
import {
  fixedPageContent,
  fixedPageDetail,
  fixedPageId,
  fixedPageSlug,
  fixedPageSummary,
  fixedPageTitle,
} from "./fixed-page-values";

const byId = z.object({ id: fixedPageId });

const saving = adminAccess.errors({
  SLUG_TAKEN: { status: 409 },
  INVALID_CONTENT: {
    status: 400,
    data: z.object({ issues: contentIssues }),
  },
});

/** 管理画面で固定ページを扱う procedure の contract。 */
export const fixedPages = {
  list: adminAccess
    .route({
      method: "GET",
      path: "/admin/fixed-pages",
      summary: "固定ページの一覧(並び順)",
    })
    .output(z.object({ pages: z.array(fixedPageSummary) })),
  get: adminAccess
    .errors({ NOT_FOUND: { status: 404 } })
    .route({
      method: "GET",
      path: "/admin/fixed-pages/{id}",
      summary: "中身を含む固定ページ",
    })
    .input(byId)
    .output(fixedPageDetail),
  create: saving
    .errors({ UNKNOWN_KIND: { status: 400 } })
    .route({
      method: "POST",
      path: "/admin/fixed-pages",
      summary: "種類を選んで固定ページを作る(公開はしない)",
    })
    .input(
      z.object({
        kind: kindName,
        slug: fixedPageSlug,
        title: fixedPageTitle,
        content: fixedPageContent,
      }),
    )
    .output(fixedPageDetail),
  update: saving
    .errors({ NOT_FOUND: { status: 404 } })
    .route({
      method: "POST",
      path: "/admin/fixed-pages/update",
      summary: "固定ページのタイトル・slug・中身を書き換える",
    })
    .input(
      byId.extend({
        slug: fixedPageSlug,
        title: fixedPageTitle,
        content: fixedPageContent,
      }),
    )
    .output(fixedPageDetail),
  publish: adminAccess
    .errors({ NOT_FOUND: { status: 404 } })
    .route({
      method: "POST",
      path: "/admin/fixed-pages/publish",
      summary: "固定ページを公開する",
    })
    .input(byId)
    .output(fixedPageSummary),
  unpublish: adminAccess
    .errors({ NOT_FOUND: { status: 404 } })
    .route({
      method: "POST",
      path: "/admin/fixed-pages/unpublish",
      summary: "固定ページを非公開に戻す",
    })
    .input(byId)
    .output(fixedPageSummary),
  reorder: adminAccess
    .errors({ ORDER_MISMATCH: { status: 409 } })
    .route({
      method: "POST",
      path: "/admin/fixed-pages/reorder",
      summary: "すべての固定ページを、渡した順に並べ直す",
    })
    .input(
      z.object({
        ids: z
          .array(fixedPageId)
          .max(1000)
          .refine((ids) => new Set(ids).size === ids.length, {
            error: "ID が重なっている",
          }),
      }),
    )
    .output(z.object({ pages: z.array(fixedPageSummary) })),
  delete: adminAccess
    .errors({ NOT_FOUND: { status: 404 } })
    .route({
      method: "POST",
      path: "/admin/fixed-pages/delete",
      summary: "固定ページを消す",
    })
    .input(byId)
    .output(z.void()),
};
