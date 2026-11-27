import { and, asc, eq, getColumns, sql } from "drizzle-orm";

import { image } from "@/db/schema/image";
import type { ShotInfo } from "@/features/images/processing/read-shot-info";
import type { ImageRow } from "@/features/images/queries/images.query";
import type { DatabaseExecutor } from "@/platform/database";

/** 変換を待つ画像の行に入れる値。 */
type PendingImage = {
  /** 写真から読み取った撮影の情報。 */
  shot: ShotInfo;
  /** 写真を受け取った日時。 */
  now: Date;
};

/** 変換を終えた画像と、その日時。 */
type Conversion = {
  /** 画像の ID。 */
  id: string;
  /** 変換を終えた日時。 */
  now: Date;
};

const isProcessing = (id: string) =>
  and(eq(image.id, id), eq(image.status, "processing"));

/** 撮影の情報を持つ、変換を待つ画像の行を作る。 */
export const insertPendingImage = async (
  db: DatabaseExecutor,
  { shot, now }: PendingImage,
): Promise<ImageRow> => {
  const [row] = await db
    .insert(image)
    .values({ ...shot, status: "processing", createdAt: now, updatedAt: now })
    .returning();

  if (row === undefined) throw new Error("作成した画像の行がありません");

  return row;
};

/** 変換を待つ画像を公開にし、書き換えた行とトランザクションの ID を返す。 */
export const markConverted = async (
  db: DatabaseExecutor,
  { id, now }: Conversion,
) => {
  const [row] = await db
    .update(image)
    .set({ status: "published", publishedAt: now })
    .where(isProcessing(id))
    .returning({
      ...getColumns(image),
      transactionId: sql<string>`pg_current_xact_id()::text`,
    });

  return row;
};

/** 変換できなかった理由を表す、画像の状態。 */
export type ConversionFailure = "unreadable" | "interrupted";

/** 変換できなかった画像と、その理由。 */
type FailedConversion = {
  /** 画像の ID。 */
  id: string;
  /** 変換できなかった理由を表す、画像の状態。 */
  failure: ConversionFailure;
};

/** 変換を待つ画像を、変換できなかった理由の状態にする。 */
export const markFailed = async (
  db: DatabaseExecutor,
  { id, failure }: FailedConversion,
): Promise<void> => {
  await db.update(image).set({ status: failure }).where(isProcessing(id));
};

/** 変換を待つ画像の ID を、受け取った順に読む。 */
export const listPendingImageIds = async (
  db: DatabaseExecutor,
): Promise<string[]> => {
  const rows = await db
    .select({ id: image.id })
    .from(image)
    .where(eq(image.status, "processing"))
    .orderBy(asc(image.id));

  return rows.map(({ id }) => id);
};
