import { type SQL, isNotNull, and, eq, asc } from "drizzle-orm";

import { fixedPage } from "@/db/schema/fixed-page";
import {
  type FixedPageRow,
  type FixedPageSummaryRow,
  fixedPageSummaryColumns,
} from "@/features/fixed-pages/fixed-pages.query";
import type { DatabaseExecutor } from "@/platform/database";

/** 公開状態を決める、固定ページの列。 */
export type PublishState = {
  /** 公開した日時か null。 */
  readonly publishedAt: Date | null;
};

/** 固定ページを、公開サイトに見せてよいかを決める。 */
export const isPublished = ({ publishedAt }: PublishState): boolean =>
  publishedAt !== null;

/** 公開サイトに見せてよい固定ページだけを選ぶ、SQL の条件。 */
export const matchPublished = (): SQL => isNotNull(fixedPage.publishedAt);

/** 引く固定ページの種類と slug。 */
export type PublishedFixedPageKey = {
  /** 種類の名前。 */
  readonly kind: string;
  /** slug。 */
  readonly slug: string;
};

/** 種類と slug で、公開している固定ページを引く。 */
export const findPublishedFixedPage = async (
  db: DatabaseExecutor,
  key: PublishedFixedPageKey,
): Promise<FixedPageRow | undefined> => {
  const [row] = await db
    .select()
    .from(fixedPage)
    .where(
      and(
        eq(fixedPage.kind, key.kind),
        eq(fixedPage.slug, key.slug),
        matchPublished(),
      ),
    );

  return row;
};

/** 公開している固定ページを、並び順に並べる。 */
export const listPublishedFixedPages = async (
  db: DatabaseExecutor,
  kindName: string | undefined,
): Promise<FixedPageSummaryRow[]> =>
  db
    .select(fixedPageSummaryColumns)
    .from(fixedPage)
    .where(
      kindName === undefined
        ? matchPublished()
        : and(matchPublished(), eq(fixedPage.kind, kindName)),
    )
    .orderBy(
      asc(fixedPage.position),
      asc(fixedPage.createdAt),
      asc(fixedPage.id),
    );
