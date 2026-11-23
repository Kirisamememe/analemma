import {
  lockSeries,
  appendImages,
} from "@/features/series/membership/queries/series-images.query";
import { adminProcedures } from "@/procedures";

/** シリーズの末尾に画像を足す procedure。 */
export const addSeriesImages = adminProcedures.series.addImages.handler(
  async ({ context, errors, input }) => {
    await context.db.transaction(async (tx) => {
      if (!(await lockSeries(tx, input.id))) throw errors.NOT_FOUND();

      if (!(await appendImages(tx, input))) {
        throw errors.NOT_FOUND();
      }
    });
    context.logger.write({
      level: "info",
      message: "シリーズに画像を足した",
      details: { seriesId: input.id },
    });
  },
);
