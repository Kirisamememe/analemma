import { and, eq } from "drizzle-orm";

import { fixedPage } from "../../../db/schema/fixed-page";
import { kind } from "../../../db/schema/kind";
import type { DatabaseExecutor } from "../../../platform/database";
import type { FixedPageRow } from "../find-fixed-page.query";
import { matchPublished } from "./match-published.query";

/** 公開している固定ページと、その種類の項目の定義。 */
export type PublishedFixedPageRow = {
  /** 固定ページの行。 */
  readonly page: FixedPageRow;
  /** 種類の項目の定義(DB の JSONB のまま)。 */
  readonly fields: unknown;
};

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
): Promise<PublishedFixedPageRow | undefined> => {
  const [row] = await db
    .select({ page: fixedPage, fields: kind.fields })
    .from(fixedPage)
    .innerJoin(kind, eq(kind.name, fixedPage.kind))
    .where(
      and(
        eq(fixedPage.kind, key.kind),
        eq(fixedPage.slug, key.slug),
        matchPublished(),
      ),
    );

  return row;
};
