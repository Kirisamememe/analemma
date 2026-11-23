import {
  type ContractOutputs,
  fixedPageContent,
  type PublishedImageValue,
} from "@analemma/contract";

import { findContentImages } from "@/features/fixed-pages/published/find-content-images";
import type { findPublishedFixedPage } from "@/features/fixed-pages/published/queries/published-fixed-pages.query";
import type { FixedPageSummaryRow } from "@/features/fixed-pages/queries/fixed-pages.query";
import type { readPublishedImages } from "@/features/images/published/queries/published-images.query";
import { toPublishedImage } from "@/features/images/to-image";

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

/** 固定ページが参照する公開画像の行と配信用の origin。 */
type PageImages = {
  /** 配信用の画像と結合した、公開している画像の行。 */
  readonly images: Awaited<ReturnType<typeof readPublishedImages>>;
  /** 配信用の画像の URL に使う origin。 */
  readonly origin: string;
};

/** 固定ページの行と画像の行を、公開サイトに返す形にする。 */
export const toPublishedFixedPage = (
  {
    page,
    fields,
  }: NonNullable<Awaited<ReturnType<typeof findPublishedFixedPage>>>,
  { images, origin }: PageImages,
): PublishedFixedPage => {
  const content = fixedPageContent.parse(page.content);
  const references = findContentImages(fields, content);
  const imageRows = Map.groupBy(images, ({ image }) => image.id);

  for (const [id, locations] of Map.groupBy(references, (ref) => ref.id)) {
    const image = toPublishedImage(imageRows.get(id) ?? [], origin);

    const value: PublishedImageValue =
      image === undefined ? { available: false } : { available: true, image };

    for (const { parent, key } of locations) parent[key] = value;
  }

  return { ...toPublishedSummary(page), content };
};
