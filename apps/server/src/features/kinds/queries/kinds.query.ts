import { eq, asc } from "drizzle-orm";

import { kind } from "@/db/schema/kind";
import type { DatabaseExecutor } from "@/platform/database";

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

/** 一覧に出す、種類の行の列。 */
export type KindSummaryRow = Omit<KindRow, "fields">;

/** 種類を、項目の定義を除いて、名前の順に並べる。 */
export const listKinds = async (
  db: DatabaseExecutor,
): Promise<KindSummaryRow[]> =>
  db
    .select({
      name: kind.name,
      label: kind.label,
      createdAt: kind.createdAt,
      updatedAt: kind.updatedAt,
    })
    .from(kind)
    .orderBy(asc(kind.name));
