import { oc } from "@orpc/contract";
import { z } from "zod";

import { kindName } from "../kinds/kind-definition";
import {
  fixedPageContent,
  fixedPageSlug,
  fixedPageTitle,
} from "./fixed-page-values";

const publishedSummary = z.object({
  kind: kindName,
  slug: fixedPageSlug,
  title: fixedPageTitle,
  publishedAt: z.iso.datetime({ offset: true }).describe("公開した日時。"),
  updatedAt: z.iso
    .datetime({ offset: true })
    .describe("タイトル・slug・中身を最後に変えた日時。"),
});

/** 公開サイトが公開している固定ページを読む procedure の contract。 */
export const publicFixedPages = {
  list: oc
    .route({
      method: "GET",
      path: "/fixed-pages",
      summary: "公開している固定ページの一覧(並び順)",
    })
    .input(z.object({ kind: kindName.optional() }))
    .output(z.object({ pages: z.array(publishedSummary) })),
  get: oc
    .errors({ NOT_FOUND: { status: 404 } })
    .route({
      method: "GET",
      path: "/fixed-pages/{kind}/{slug}",
      summary: "公開している固定ページ(無ければ NOT_FOUND)",
    })
    .input(z.object({ kind: kindName, slug: fixedPageSlug }))
    .output(
      publishedSummary.extend({
        content: fixedPageContent.describe(
          "保存した中身(今の種類の定義に無いキーも含む)。",
        ),
      }),
    ),
};
