import { listDeliveryImages } from "@/features/images/queries/delivery-images.query";
import type { ImageRow } from "@/features/images/queries/images.query";
import {
  type AdminImage,
  toAdminImage,
} from "@/features/images/to-admin-image";
import type { DatabaseExecutor } from "@/platform/database";

/** 画像の行に配信用の画像を読み足し、管理画面に返す形にする。 */
export const loadAdminImages = async (
  db: DatabaseExecutor,
  rows: readonly ImageRow[],
): Promise<AdminImage[]> => {
  const deliveryImages = Map.groupBy(
    await listDeliveryImages(
      db,
      rows.map(({ id }) => id),
    ),
    ({ imageId }) => imageId,
  );

  return rows.map((row) => toAdminImage(row, deliveryImages.get(row.id) ?? []));
};

/** 1つの画像の行に配信用の画像を読み足し、管理画面に返す形にする。 */
export const loadAdminImage = async (
  db: DatabaseExecutor,
  row: ImageRow,
): Promise<AdminImage> =>
  toAdminImage(row, await listDeliveryImages(db, [row.id]));
