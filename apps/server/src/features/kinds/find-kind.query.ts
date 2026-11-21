import { eq } from "drizzle-orm";

import { kind } from "../../db/schema/kind";
import type { DatabaseExecutor } from "../../platform/database";

/** 種類の行。 */
export type KindRow = typeof kind.$inferSelect;

/** 名前で種類の行を引く。 */
export const findKind = async (
  db: DatabaseExecutor,
  name: string,
): Promise<KindRow | undefined> => {
  const [row] = await db.select().from(kind).where(eq(kind.name, name));

  return row;
};
