import { and, eq, ne, notExists, sql } from "drizzle-orm";

import type { ContractInputs } from "@analemma/contract";

import { series } from "@/db/schema/series";
import type { Database, DatabaseExecutor } from "@/platform/database";

type Fields = ContractInputs["admin"]["series"]["create"];

/** 新しいシリーズの行。 */
export const insertSeries = async (db: DatabaseExecutor, fields: Fields) => {
  const [row] = await db
    .insert(series)
    .values(fields)
    .onConflictDoNothing({ target: series.slug })
    .returning();

  return row;
};

/** シリーズの名前・slug・説明の書き換え。 */
export const replaceSeries = async (
  db: Database,
  { id, ...fields }: ContractInputs["admin"]["series"]["update"],
) =>
  db.transaction(async (tx) => {
    const taken = tx
      .select({ id: series.id })
      .from(series)
      .where(and(eq(series.slug, fields.slug), ne(series.id, id)));

    const [row] = await tx
      .update(series)
      .set(fields)
      .where(and(eq(series.id, id), notExists(taken)))
      .returning();

    if (row === undefined) {
      const exists = await tx.$count(series, eq(series.id, id));
      return exists
        ? ({ _tag: "SlugTaken" } as const)
        : ({ _tag: "Missing" } as const);
    }

    return { _tag: "Saved", row } as const;
  });

/** シリーズの公開日時の変更。 */
export const setPublished = async (
  db: DatabaseExecutor,
  { id, publishedAt }: Pick<typeof series.$inferSelect, "id" | "publishedAt">,
) => {
  const [row] = await db
    .update(series)
    .set({
      publishedAt:
        publishedAt === null
          ? null
          : sql`coalesce(${series.publishedAt}, ${publishedAt.toISOString()}::timestamptz)`,
    })
    .where(eq(series.id, id))
    .returning();

  return row;
};

/** シリーズの物理削除。 */
export const deleteSeriesRow = async (db: DatabaseExecutor, id: string) => {
  const rows = await db
    .delete(series)
    .where(eq(series.id, id))
    .returning({ id: series.id });

  return rows.length > 0;
};
