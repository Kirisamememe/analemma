import type { KindDefinition } from "@analemma/contract";

import { kind } from "../../../db/schema/kind";
import type { DatabaseExecutor } from "../../../platform/database";

/** 新しく作るかもしれない種類と、送られた日時。 */
export type KindInsert = {
  /** 送られた種類の定義。 */
  readonly kinds: readonly KindDefinition[];
  /** 送られた日時。 */
  readonly now: Date;
};

/** まだ無い種類の行を作り、作った種類の名前を返す。 */
export const insertNewKinds = async (
  db: DatabaseExecutor,
  { kinds, now }: KindInsert,
): Promise<ReadonlySet<string>> => {
  if (kinds.length === 0) {
    return new Set();
  }

  const rows = await db
    .insert(kind)
    .values(
      kinds.map(({ fields, label, name }) => ({
        name,
        label,
        fields,
        createdAt: now,
        updatedAt: now,
      })),
    )
    .onConflictDoNothing({ target: kind.name })
    .returning({ name: kind.name });

  return new Set(rows.map(({ name }) => name));
};
