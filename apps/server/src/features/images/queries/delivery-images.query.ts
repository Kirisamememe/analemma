import { and, eq, inArray } from "drizzle-orm";

import { deliveryImage } from "@/db/schema/delivery-image";
import { image } from "@/db/schema/image";
import type { DeliveryImageTarget } from "@/features/images/delivery/delivery-image-path";
import type { ImageRow } from "@/features/images/queries/images.query";
import type { DatabaseExecutor } from "@/platform/database";

/** 配信用の画像の行。 */
export type DeliveryImageRow = typeof deliveryImage.$inferSelect;

/** 画像の ID ごとに、配信用の画像の行を読む。 */
export const listDeliveryImages = async (
  db: DatabaseExecutor,
  imageIds: readonly string[],
): Promise<DeliveryImageRow[]> =>
  imageIds.length === 0
    ? []
    : db
        .select()
        .from(deliveryImage)
        .where(inArray(deliveryImage.imageId, [...imageIds]));

/** 配信用の画像のファイルの名前と、その画像を公開した日時。 */
export type DeliveryImageFile = Pick<DeliveryImageRow, "fileKey"> &
  Pick<ImageRow, "publishedAt">;

/** 画像の ID と幅で、配信用の画像のファイルの名前と、画像を公開した日時を引く。 */
export const findDeliveryImageFile = async (
  db: DatabaseExecutor,
  { imageId, width }: DeliveryImageTarget,
): Promise<DeliveryImageFile | undefined> => {
  const [row] = await db
    .select({ fileKey: deliveryImage.fileKey, publishedAt: image.publishedAt })
    .from(deliveryImage)
    .innerJoin(image, eq(image.id, deliveryImage.imageId))
    .where(
      and(eq(deliveryImage.imageId, imageId), eq(deliveryImage.width, width)),
    );

  return row;
};
