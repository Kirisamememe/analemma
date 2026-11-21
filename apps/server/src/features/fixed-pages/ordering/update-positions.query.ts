import { eq } from "drizzle-orm";

import { fixedPage } from "../../../db/schema/fixed-page";
import type { DatabaseExecutor } from "../../../platform/database";

/** 渡した順に、固定ページの並び順を 0 から振り直す。 */
export const updatePositions = async (
  db: DatabaseExecutor,
  ids: readonly string[],
): Promise<void> => {
  await Promise.all(
    ids.map(async (id, position) =>
      db.update(fixedPage).set({ position }).where(eq(fixedPage.id, id)),
    ),
  );
};
