import { eq } from "drizzle-orm";

import { fixedPage } from "../../db/schema/fixed-page";
import type { DatabaseExecutor } from "../../platform/database";

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
