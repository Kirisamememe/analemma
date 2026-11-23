import { deliveryImage } from "@/db/schema/delivery-image";
import { image } from "@/db/schema/image";
import type { ShotInfo } from "@/features/images/processing/read-shot-info";
import type { DeliveryImageRow } from "@/features/images/queries/delivery-images.query";
import type { ImageRow } from "@/features/images/queries/images.query";
import type { DatabaseExecutor } from "@/platform/database";

type NewImage = {
  /** 写真から読み取った撮影の情報。 */
  shot: ShotInfo;
  /** 画像を登録する日時。 */
  now: Date;
};

/** 既定の公開状態と撮影の情報で、画像の行を作る。 */
export const insertImage = async (
  db: DatabaseExecutor,
  { shot, now }: NewImage,
): Promise<ImageRow> => {
  const [row] = await db
    .insert(image)
    .values({
      ...shot,
      publishedAt: now,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

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
