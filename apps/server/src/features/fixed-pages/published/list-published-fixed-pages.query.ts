import { and, asc, eq } from "drizzle-orm";

import { fixedPage } from "../../../db/schema/fixed-page";
import type { DatabaseExecutor } from "../../../platform/database";
import {
  type FixedPageSummaryRow,
  fixedPageSummaryColumns,
} from "../list-fixed-pages.query";
import { matchPublished } from "./match-published.query";

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
