import { and, eq } from "drizzle-orm";

import { deliveryImage } from "@/db/schema/delivery-image";
import { image } from "@/db/schema/image";
import { matchPublished } from "@/features/images/queries/images.query";
import type { DatabaseExecutor } from "@/platform/database";

/** 公開している画像と幅ごとの配信用の画像をまとめて引く。 */
export const readPublishedImage = (db: DatabaseExecutor, id: string) =>
  db
    .select({ image, deliveryImage })
    .from(image)
    .leftJoin(deliveryImage, eq(deliveryImage.imageId, image.id))
    .where(and(eq(image.id, id), matchPublished()));
