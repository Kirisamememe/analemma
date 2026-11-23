import { desc, eq } from "drizzle-orm";

import { deliveryImage } from "@/db/schema/delivery-image";
import { image } from "@/db/schema/image";
import { series, seriesImage } from "@/db/schema/series";
import type { DatabaseExecutor } from "@/platform/database";

/** シリーズと、その画像と配信用の画像の行。 */
export const readSeriesRows = (db: DatabaseExecutor, id: string) =>
  db
    .select({ series, image, deliveryImage })
    .from(series)
    .leftJoin(seriesImage, eq(series.id, seriesImage.seriesId))
    .leftJoin(image, eq(image.id, seriesImage.imageId))
    .leftJoin(deliveryImage, eq(deliveryImage.imageId, image.id))
    .where(eq(series.id, id))
    .orderBy(seriesImage.position);

/** シリーズの一覧と、それぞれの画像の数と先頭の画像。 */
export const listSeriesRows = (db: DatabaseExecutor) => {
  const memberOfSeries = eq(seriesImage.seriesId, series.id);

  const firstId = db
    .select({ id: seriesImage.imageId })
    .from(seriesImage)
    .where(memberOfSeries)
    .orderBy(seriesImage.position)
    .limit(1);

  return db
    .select({
      series,
      imageCount: db.$count(seriesImage, memberOfSeries),
      cover: image,
    })
    .from(series)
    .leftJoin(image, eq(image.id, firstId))
    .orderBy(desc(series.id));
};
