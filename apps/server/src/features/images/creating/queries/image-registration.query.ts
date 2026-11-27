import { getColumns, sql } from "drizzle-orm";

import { deliveryImage } from "@/db/schema/delivery-image";
import { image } from "@/db/schema/image";
import type { ShotInfo } from "@/features/images/processing/read-shot-info";
import type { DeliveryImageRow } from "@/features/images/queries/delivery-images.query";
import type { DatabaseExecutor } from "@/platform/database";

type NewImage = {
  /** 写真から読み取った撮影の情報。 */
  shot: ShotInfo;
  /** 画像を登録する日時。 */
  now: Date;
};

/** 撮影の情報を持つ画像の行を作り、行とトランザクションの ID を返す。 */
export const insertImage = async (
  db: DatabaseExecutor,
  { shot, now }: NewImage,
) => {
  const [row] = await db
    .insert(image)
    .values({
      ...shot,
      status: "published",
      publishedAt: now,
      createdAt: now,
      updatedAt: now,
    })
    .returning({
      ...getColumns(image),
      transactionId: sql<string>`pg_current_xact_id()::text`,
    });

  if (row === undefined) throw new Error("作成した画像の行がありません");

  return row;
};

/** 配信用の画像の行をまとめて作る。 */
export const insertDeliveryImages = async (
  db: DatabaseExecutor,
  rows: DeliveryImageRow[],
): Promise<void> => {
  await db.insert(deliveryImage).values(rows);
};

/** 画像を登録するトランザクションのロールバックが確定しているかを読む。 */
export const wasRegistrationAborted = async (
  db: DatabaseExecutor,
  transactionId: string,
): Promise<boolean> => {
  const [row] = await db.execute<Record<"aborted", boolean | null>>(
    sql`select pg_xact_status(${transactionId}::xid8) = 'aborted' as aborted`,
    "objects",
  );

  return row?.aborted === true;
};
