import { and, desc, eq, isNotNull, sql, type SQL } from "drizzle-orm";

import { deliveryImage } from "@/db/schema/delivery-image";
import { image } from "@/db/schema/image";
import { series, seriesImage } from "@/db/schema/series";
import { matchPublished as matchPublishedImage } from "@/features/images/queries/images.query";
import type { DatabaseExecutor } from "@/platform/database";

const fields = {
  name: series.name,
  slug: series.slug,
  description: series.description,
};

/** シリーズを公開しているか。 */
export const isPublished = (
  row: Pick<typeof series.$inferSelect, "publishedAt">,
): boolean => row.publishedAt !== null;

const matchPublished = (): SQL => isNotNull(series.publishedAt);

/** 公開シリーズとその公開画像を、シリーズ内の並び順で読む。 */
export const readPublishedSeries = (db: DatabaseExecutor, slug: string) =>
  db
    .select({ fields, image, deliveryImage })
    .from(series)
    .leftJoin(seriesImage, eq(series.id, seriesImage.seriesId))
    .leftJoin(
      image,
      and(eq(image.id, seriesImage.imageId), matchPublishedImage()),
    )
    .leftJoin(deliveryImage, eq(deliveryImage.imageId, image.id))
    .where(and(matchPublished(), eq(series.slug, slug)))
    .orderBy(seriesImage.position);

/** 公開シリーズごとに、公開画像の数と先頭の画像をまとめて読む。 */
export const listPublishedSeriesRows = (db: DatabaseExecutor) => {
  const first = db
    .select({
      id: image.id,
      imageCount: sql`count(*) over ()`.as("image_count"),
    })
    .from(seriesImage)
    .innerJoin(image, eq(image.id, seriesImage.imageId))
    .where(and(eq(seriesImage.seriesId, series.id), matchPublishedImage()))
    .orderBy(seriesImage.position)
    .limit(1)
    .as("first_image");

  return db
    .select({
      fields,
      image,
      deliveryImage,
      imageCount: sql<number>`coalesce(${first.imageCount}, 0)`.mapWith(Number),
    })
    .from(series)
    .leftJoinLateral(first, sql`true`)
    .leftJoin(image, eq(image.id, first.id))
    .leftJoin(deliveryImage, eq(deliveryImage.imageId, image.id))
    .where(matchPublished())
    .orderBy(desc(series.id));
};
