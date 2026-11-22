import { type ContractOutputs, fixedPageContent } from "@analemma/contract";

import { isPublished } from "@/features/fixed-pages/published/queries/published-fixed-pages.query";
import type {
  FixedPageRow,
  FixedPageSummaryRow,
} from "@/features/fixed-pages/queries/fixed-pages.query";

type FixedPageOutputs = ContractOutputs["admin"]["fixedPages"];

/** 管理画面に返す、固定ページの一覧の1件。 */
export type FixedPageSummary = FixedPageOutputs["list"]["pages"][number];

/** 管理画面に返す、中身を含む固定ページ。 */
export type FixedPageDetail = FixedPageOutputs["get"];

/** 固定ページの行を、一覧の1件の形にする。 */
export const toFixedPageSummary = (
  row: FixedPageSummaryRow,
): FixedPageSummary => ({
  id: row.id,
  kind: row.kind,
  slug: row.slug,
  title: row.title,
  published: isPublished(row),
  publishedAt: row.publishedAt?.toISOString() ?? null,
  position: row.position,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

/** 固定ページの行を、中身を含む形にする。 */
export const toFixedPageDetail = (row: FixedPageRow): FixedPageDetail => ({
  ...toFixedPageSummary(row),
  content: fixedPageContent.parse(row.content),
});
