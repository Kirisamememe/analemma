import { asc, inArray } from "drizzle-orm";

import { kind } from "../../../db/schema/kind";
import type { DatabaseExecutor } from "../../../platform/database";

/** すでにある種類の行のロックを、名前の順に取り、その名前を返す。 */
export const lockKinds = async (
  db: DatabaseExecutor,
  names: readonly string[],
): Promise<string[]> => {
  if (names.length === 0) {
    return [];
  }

  const rows = await db
    .select({ name: kind.name })
    .from(kind)
    .where(inArray(kind.name, [...names]))
    .orderBy(asc(kind.name))
    .for("no key update");

  return rows.map(({ name }) => name);
};
