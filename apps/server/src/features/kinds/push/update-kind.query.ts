import { and, eq, ne, or } from "drizzle-orm";

import type { KindDefinition } from "@analemma/contract";

import { kind } from "../../../db/schema/kind";
import type { DatabaseExecutor } from "../../../platform/database";

/** 書き換える種類の定義と、送られた日時。 */
export type KindUpdate = {
  /** 送られた種類の定義。 */
  readonly definition: KindDefinition;
  /** 送られた日時。 */
  readonly now: Date;
};

/** 定義が変わったときだけ種類の行を書き換え、書き換えたかを返す。 */
export const updateKind = async (
  db: DatabaseExecutor,
  { definition, now }: KindUpdate,
): Promise<boolean> => {
  const rows = await db
    .update(kind)
    .set({ label: definition.label, fields: definition.fields, updatedAt: now })
    .where(
      and(
        eq(kind.name, definition.name),
        or(
          ne(kind.label, definition.label),
          ne(kind.fields, definition.fields),
        ),
      ),
    )
    .returning({ name: kind.name });

  return rows.length > 0;
};
