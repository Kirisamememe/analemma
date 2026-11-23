import { asc, desc, eq, gt, lt } from "drizzle-orm";

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

/** 新しく足した順に並べたときの、前後の画像の ID。 */
export type NeighborIds = {
  /** 一つ新しく足した画像の ID。 */
  readonly newer: string | undefined;
  /** 一つ古く足した画像の ID。 */
  readonly older: string | undefined;
};

/** 画像の ID の、一つ新しい画像と一つ古い画像の ID を引く。 */
export const findNeighborIds = async (
  db: DatabaseExecutor,
  id: string,
): Promise<NeighborIds> => {
  const [newer] = await db
    .select({ id: image.id })
    .from(image)
    .where(gt(image.id, id))
    .orderBy(asc(image.id))
    .limit(1);

  const [older] = await db
    .select({ id: image.id })
    .from(image)
    .where(lt(image.id, id))
    .orderBy(desc(image.id))
    .limit(1);

  return { newer: newer?.id, older: older?.id };
};
