import { asc, sql } from "drizzle-orm";

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

/** 渡した順に、固定ページの並び順を 0 から1文で振り直す。 */
export const updatePositions = async (
  db: DatabaseExecutor,
  ids: readonly string[],
): Promise<void> => {
  await db.execute(sql`
    update ${fixedPage}
    set position = ordered.position - 1
    from jsonb_array_elements_text(${JSON.stringify(ids)}::text::jsonb)
      with ordinality as ordered(id, position)
    where ${fixedPage.id} = ordered.id::uuid
  `);
};
