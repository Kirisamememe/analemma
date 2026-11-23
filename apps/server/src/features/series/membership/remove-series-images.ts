import {
  lockSeries,
  removeImages,
} from "@/features/series/membership/queries/series-images.query";
import { adminProcedures } from "@/procedures";

/** シリーズから画像を外す procedure。 */
export const removeSeriesImages = adminProcedures.series.removeImages.handler(
  async ({ context, errors, input }) => {
    await context.db.transaction(async (tx) => {
      if (!(await lockSeries(tx, input.id))) throw errors.NOT_FOUND();

      await removeImages(tx, input);
    });
    context.logger.write({
      level: "info",
      message: "シリーズから画像を外した",
      details: { seriesId: input.id },
    });
  },
);
