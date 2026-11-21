import type { InferContractRouterOutputs } from "@orpc/contract";

import {
  type contract,
  fixedPageContent,
  toContentSchema,
} from "@analemma/contract";

import { readKindFields } from "../../kinds/read-kind-fields";
import type { FixedPageRow } from "../find-fixed-page.query";
import type { PublishedFixedPageRow } from "./find-published-fixed-page.query";

type PublicOutputs = InferContractRouterOutputs<
  typeof contract
>["public"]["fixedPages"];

/** 公開サイトに返す、公開している固定ページの一覧の1件。 */
export type PublishedSummary = PublicOutputs["list"]["pages"][number];

/** 公開サイトに返す、公開している固定ページ。 */
export type PublishedFixedPage = PublicOutputs["get"];

/** 公開している固定ページの行を、一覧の1件の形にする。 */
export const toPublishedSummary = (row: FixedPageRow): PublishedSummary => {
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

/** 公開している固定ページを、今の定義にある項目だけの中身にして返す形にする。 */
export const toPublishedFixedPage = ({
  fields,
  page,
}: PublishedFixedPageRow): PublishedFixedPage => ({
  ...toPublishedSummary(page),
  content: fixedPageContent.parse(
    toContentSchema({
      fields: readKindFields(fields),
      unknownKeys: "strip",
    }).parse(page.content),
  ),
});
