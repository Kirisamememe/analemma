import { asc } from "drizzle-orm";

import { fixedPage } from "../../db/schema/fixed-page";
import type { DatabaseExecutor } from "../../platform/database";
import type { FixedPageRow } from "./find-fixed-page.query";

/** すべての固定ページを、並び順に並べる。 */
export const listFixedPages = async (
  db: DatabaseExecutor,
): Promise<FixedPageRow[]> =>
  db
    .select()
    .from(fixedPage)
    .orderBy(
      asc(fixedPage.position),
      asc(fixedPage.createdAt),
      asc(fixedPage.id),
    );
