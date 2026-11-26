import { and, desc, eq, isNotNull, sql, type SQL } from "drizzle-orm";

import { collection, collectionImage } from "@/db/schema/collection";
import { deliveryImage } from "@/db/schema/delivery-image";
import { image } from "@/db/schema/image";
import { matchPublished as matchPublishedImage } from "@/features/images/queries/images.query";
import type { DatabaseExecutor } from "@/platform/database";

const fields = {
  name: collection.name,
  slug: collection.slug,
  description: collection.description,
};

/** コレクションを公開しているか。 */
export const isPublished = (
  row: Pick<typeof collection.$inferSelect, "publishedAt">,
): boolean => row.publishedAt !== null;

const matchPublished = (): SQL => isNotNull(collection.publishedAt);

/** 公開しているコレクションと、その公開画像を、コレクションの中の並び順で読む。 */
export const readPublishedCollection = (db: DatabaseExecutor, slug: string) =>
  db
    .select({ fields, image, deliveryImage })
    .from(collection)
    .leftJoin(collectionImage, eq(collection.id, collectionImage.collectionId))
    .leftJoin(
      image,
      and(eq(image.id, collectionImage.imageId), matchPublishedImage()),
    )
    .leftJoin(deliveryImage, eq(deliveryImage.imageId, image.id))
    .where(and(matchPublished(), eq(collection.slug, slug)))
    .orderBy(collectionImage.position);

/** 公開しているコレクションごとに、公開画像の数と先頭の画像をまとめて読む。 */
export const listPublishedCollectionRows = (db: DatabaseExecutor) => {
  const first = db
    .select({
      id: image.id,
      imageCount: sql`count(*) over ()`.as("image_count"),
    })
    .from(collectionImage)
    .innerJoin(image, eq(image.id, collectionImage.imageId))
    .where(
      and(
        eq(collectionImage.collectionId, collection.id),
        matchPublishedImage(),
      ),
    )
    .orderBy(collectionImage.position)
    .limit(1)
    .as("first_image");

  return db
    .select({
      fields,
      image,
      deliveryImage,
      imageCount: sql<number>`coalesce(${first.imageCount}, 0)`.mapWith(Number),
    })
    .from(collection)
    .leftJoinLateral(first, sql`true`)
    .leftJoin(image, eq(image.id, first.id))
    .leftJoin(deliveryImage, eq(deliveryImage.imageId, image.id))
    .where(matchPublished())
    .orderBy(desc(collection.id));
};
