import { and, eq, ne, notExists, sql } from "drizzle-orm";

import type { ContractInputs } from "@analemma/contract";

import { collection } from "@/db/schema/collection";
import type { Database, DatabaseExecutor } from "@/platform/database";

type Fields = ContractInputs["admin"]["collections"]["create"];

/** 新しいコレクションの行。 */
export const insertCollection = async (
  db: DatabaseExecutor,
  fields: Fields,
) => {
  const [row] = await db
    .insert(collection)
    .values(fields)
    .onConflictDoNothing({ target: collection.slug })
    .returning();

  return row;
};

/** コレクションの名前・slug・説明の書き換え。 */
export const replaceCollection = async (
  db: Database,
  { id, ...fields }: ContractInputs["admin"]["collections"]["update"],
) =>
  db.transaction(async (tx) => {
    const taken = tx
      .select({ id: collection.id })
      .from(collection)
      .where(and(eq(collection.slug, fields.slug), ne(collection.id, id)));

    const [row] = await tx
      .update(collection)
      .set(fields)
      .where(and(eq(collection.id, id), notExists(taken)))
      .returning();

    if (row === undefined) {
      const exists = await tx.$count(collection, eq(collection.id, id));
      return exists
        ? ({ _tag: "SlugTaken" } as const)
        : ({ _tag: "Missing" } as const);
    }

    return { _tag: "Saved", row } as const;
  });

/** コレクションの公開日時の変更。 */
export const setPublished = async (
  db: DatabaseExecutor,
  {
    id,
    publishedAt,
  }: Pick<typeof collection.$inferSelect, "id" | "publishedAt">,
) => {
  const [row] = await db
    .update(collection)
    .set({
      publishedAt:
        publishedAt === null
          ? null
          : sql`coalesce(${collection.publishedAt}, ${publishedAt.toISOString()}::timestamptz)`,
    })
    .where(eq(collection.id, id))
    .returning();

  return row;
};

/** コレクションの物理削除。 */
export const deleteCollectionRow = async (db: DatabaseExecutor, id: string) => {
  const rows = await db
    .delete(collection)
    .where(eq(collection.id, id))
    .returning({ id: collection.id });

  return rows.length > 0;
};
