import { eq } from "drizzle-orm";

import { fixedPage } from "@/db/schema/fixed-page";
import type { FixedPageRow } from "@/features/fixed-pages/fixed-pages.query";
import type { DatabaseExecutor } from "@/platform/database";

/** 書き換える固定ページの行のロックを取り、その行を返す。 */
export const lockFixedPage = async (
  db: DatabaseExecutor,
  id: string,
): Promise<FixedPageRow | undefined> => {
  const [row] = await db
    .select()
    .from(fixedPage)
    .where(eq(fixedPage.id, id))
    .for("update");

  return row;
};
