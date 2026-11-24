import { desc, eq } from "drizzle-orm";

import { collection, collectionImage } from "@/db/schema/collection";
import { deliveryImage } from "@/db/schema/delivery-image";
import { image } from "@/db/schema/image";
import type { DatabaseExecutor } from "@/platform/database";

/** コレクションと、その画像と配信用の画像の行。 */
export const readCollectionRows = (db: DatabaseExecutor, id: string) =>
  db
    .select({ collection, image, deliveryImage })
    .from(collection)
    .leftJoin(collectionImage, eq(collection.id, collectionImage.collectionId))
    .leftJoin(image, eq(image.id, collectionImage.imageId))
    .leftJoin(deliveryImage, eq(deliveryImage.imageId, image.id))
    .where(eq(collection.id, id))
    .orderBy(collectionImage.position);

/** コレクションの一覧と、それぞれの画像の数と先頭の画像。 */
export const listCollectionRows = (db: DatabaseExecutor) => {
  const memberOfCollection = eq(collectionImage.collectionId, collection.id);

  const firstId = db
    .select({ id: collectionImage.imageId })
    .from(collectionImage)
    .where(memberOfCollection)
    .orderBy(collectionImage.position)
    .limit(1);

  return db
    .select({
      collection,
      imageCount: db.$count(collectionImage, memberOfCollection),
      cover: image,
    })
    .from(collection)
    .leftJoin(image, eq(image.id, firstId))
    .orderBy(desc(collection.id));
};
