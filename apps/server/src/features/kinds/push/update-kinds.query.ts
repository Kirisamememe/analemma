import { sql } from "drizzle-orm";

import type { KindDefinition } from "@analemma/contract";

import { kind } from "../../../db/schema/kind";
import type { DatabaseExecutor } from "../../../platform/database";

/** 書き換えた種類の行の名前。 */
type UpdatedKind = {
  /** 種類の名前。 */
  readonly name: string;
};

/** 書き換えるかもしれない種類の定義と、送られた日時。 */
export type KindUpdate = {
  /** 送られた種類の定義。 */
  readonly kinds: readonly KindDefinition[];
  /** 送られた日時。 */
  readonly now: Date;
};

/** ラベルか項目が変わった種類の行だけを1文で書き換え、書き換えた種類の名前を返す。 */
export const updateKinds = async (
  db: DatabaseExecutor,
  { kinds, now }: KindUpdate,
): Promise<ReadonlySet<string>> => {
  if (kinds.length === 0) {
    return new Set();
  }

  const sent = JSON.stringify(
    kinds.map(({ fields, label, name }) => ({ name, label, fields })),
  );
  const rows = await db.execute<UpdatedKind>(sql`
    update ${kind}
    set label = sent.label, fields = sent.fields, updated_at = ${now}
    from jsonb_to_recordset(${sent}::text::jsonb)
      as sent(name text, label text, fields jsonb)
    where ${kind.name} = sent.name
      and (${kind.label} <> sent.label or ${kind.fields} <> sent.fields)
    returning ${kind.name}
  `);

  return new Set(rows.map(({ name }) => name));
};
