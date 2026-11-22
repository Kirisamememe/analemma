import { eq } from "drizzle-orm";

import { fixedPage } from "../../../db/schema/fixed-page";
import type { DatabaseExecutor } from "../../../platform/database";

/** 固定ページの行を消し、消せたかを返す。 */
export const deleteFixedPage = async (
  db: DatabaseExecutor,
  id: string,
): Promise<boolean> => {
  const rows = await db
    .delete(fixedPage)
    .where(eq(fixedPage.id, id))
    .returning({ id: fixedPage.id });

  return rows.length > 0;
};
