import type { ContractOutputs, FixedPageContent } from "@analemma/contract";

import type {
  FixedPageRow,
  FixedPageSummaryRow,
} from "@/features/fixed-pages/queries/fixed-pages.query";

type PublicOutputs = ContractOutputs["public"]["fixedPages"];

/** 公開サイトに返す、公開している固定ページの一覧の1件。 */
export type PublishedSummary = PublicOutputs["list"]["pages"][number];

/** 公開サイトに返す、公開している固定ページ。 */
export type PublishedFixedPage = PublicOutputs["get"];

/** 公開している固定ページの行を、一覧の1件の形にする。 */
export const toPublishedSummary = (
  row: FixedPageSummaryRow,
): PublishedSummary => {
  if (row.publishedAt === null) {
    throw new Error("公開していない固定ページを公開 API で返そうとした");
  }

  return {
    kind: row.kind,
    slug: row.slug,
    title: row.title,
    publishedAt: row.publishedAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
};

/** 公開している固定ページを、画像の項目を解いた中身と一緒に返す形にする。 */
export const toPublishedFixedPage = (
  row: FixedPageRow,
  content: FixedPageContent,
): PublishedFixedPage => ({
  ...toPublishedSummary(row),
  content,
});
