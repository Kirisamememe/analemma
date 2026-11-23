import { asc, desc, eq, gt, lt, sql } from "drizzle-orm";

import { image } from "@/db/schema/image";
import type { DatabaseExecutor } from "@/platform/database";

/** 画像の行。 */
export type ImageRow = typeof image.$inferSelect;

/** 画像の行を読む範囲。 */
export type ImageRange = {
  /** 前のページの、最後の画像の ID。 */
  readonly before?: string | undefined;
  /** 読む行の数の上限。 */
  readonly limit: number;
};

/** 画像を公開しているか。 */
export const isPublished = (row: Pick<ImageRow, "publishedAt">): boolean =>
  row.publishedAt !== null;

/** ID で画像の行を引く。 */
export const findImage = async (
  db: DatabaseExecutor,
  id: string,
): Promise<ImageRow | undefined> => {
  const [row] = await db.select().from(image).where(eq(image.id, id));

  return row;
};

/** 画像の行を、新しく足した順に読む。 */
export const listImages = async (
  db: DatabaseExecutor,
  { before, limit }: ImageRange,
): Promise<ImageRow[]> =>
  db
    .select()
    .from(image)
    .where(before === undefined ? undefined : lt(image.id, before))
    .orderBy(desc(image.id))
    .limit(limit);

/** 対象の画像と同じ時点での、一つ新しい画像と一つ古い画像の ID を引く。 */
export const findNeighborIds = async (db: DatabaseExecutor, id: string) => {
  const newer = db
    .select({ id: image.id })
    .from(image)
    .where(gt(image.id, id))
    .orderBy(asc(image.id))
    .limit(1)
    .as("newer");

  const older = db
    .select({ id: image.id })
    .from(image)
    .where(lt(image.id, id))
    .orderBy(desc(image.id))
    .limit(1)
    .as("older");

  const [neighbors] = await db
    .select({ newer: newer.id, older: older.id })
    .from(image)
    .leftJoin(newer, sql`true`)
    .leftJoin(older, sql`true`)
    .where(eq(image.id, id));

  return neighbors;
};
