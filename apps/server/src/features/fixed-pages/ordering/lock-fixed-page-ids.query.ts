import { asc } from "drizzle-orm";

import { fixedPage } from "../../../db/schema/fixed-page";
import type { DatabaseExecutor } from "../../../platform/database";

/** すべての固定ページの行のロックを、ID の順に取り、ID を返す。 */
export const lockFixedPageIds = async (
  db: DatabaseExecutor,
): Promise<string[]> => {
  const rows = await db
    .select({ id: fixedPage.id })
    .from(fixedPage)
    .orderBy(asc(fixedPage.id))
    .for("update");

  return rows.map(({ id }) => id);
};
