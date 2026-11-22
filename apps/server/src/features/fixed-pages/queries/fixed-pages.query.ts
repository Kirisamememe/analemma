import { eq, asc } from "drizzle-orm";

import { fixedPage } from "@/db/schema/fixed-page";
import type { DatabaseExecutor } from "@/platform/database";

/** 固定ページの行。 */
export type FixedPageRow = typeof fixedPage.$inferSelect;

/** ID で固定ページの行を引く。 */
export const findFixedPage = async (
  db: DatabaseExecutor,
  id: string,
): Promise<FixedPageRow | undefined> => {
  const [row] = await db.select().from(fixedPage).where(eq(fixedPage.id, id));

  return row;
};

/** 一覧に出す、中身を除いた固定ページの行。 */
export type FixedPageSummaryRow = Omit<FixedPageRow, "content">;

/** 一覧のために読む、中身を除いた固定ページの列。 */
export const fixedPageSummaryColumns = {
  id: fixedPage.id,
  kind: fixedPage.kind,
  slug: fixedPage.slug,
  title: fixedPage.title,
  position: fixedPage.position,
  publishedAt: fixedPage.publishedAt,
  createdAt: fixedPage.createdAt,
  updatedAt: fixedPage.updatedAt,
};

/** すべての固定ページを、中身を除いて、並び順に並べる。 */
export const listFixedPages = async (
  db: DatabaseExecutor,
): Promise<FixedPageSummaryRow[]> =>
  db
    .select(fixedPageSummaryColumns)
    .from(fixedPage)
    .orderBy(
      asc(fixedPage.position),
      asc(fixedPage.createdAt),
      asc(fixedPage.id),
    );
