import { inArray } from "drizzle-orm";

import { deliveryImage } from "@/db/schema/delivery-image";
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
