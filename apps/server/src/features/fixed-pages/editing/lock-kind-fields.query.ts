import { eq } from "drizzle-orm";

import type { FieldDefinition } from "@analemma/contract";

import { kind } from "../../../db/schema/kind";
import type { DatabaseExecutor } from "../../../platform/database";
import { readKindFields } from "../../kinds/read-kind-fields";

/** 種類の行の共有ロックを取り、項目の定義を返す。 */
export const lockKindFields = async (
  db: DatabaseExecutor,
  name: string,
): Promise<FieldDefinition[] | undefined> => {
  const [row] = await db
    .select({ fields: kind.fields })
    .from(kind)
    .where(eq(kind.name, name))
    .for("share");

  return row === undefined ? undefined : readKindFields(row.fields);
};
