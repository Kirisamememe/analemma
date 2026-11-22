import { and, eq } from "drizzle-orm";

import { fixedPage } from "../../../db/schema/fixed-page";
import type { DatabaseExecutor } from "../../../platform/database";
import type { FixedPageRow } from "../find-fixed-page.query";
import { matchPublished } from "./match-published.query";

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
