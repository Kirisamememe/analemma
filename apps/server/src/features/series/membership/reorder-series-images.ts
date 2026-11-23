import {
  lockSeries,
  reorderImages,
} from "@/features/series/membership/queries/series-images.query";
import { adminProcedures } from "@/procedures";

/** シリーズの画像を渡した順に並べ直す procedure。 */
export const reorderSeriesImages = adminProcedures.series.reorder.handler(
  async ({ context, errors, input }) => {
    await context.db.transaction(async (tx) => {
      if (!(await lockSeries(tx, input.id))) throw errors.NOT_FOUND();

      if (!(await reorderImages(tx, input))) {
        throw errors.ORDER_MISMATCH();
      }
    });
    context.logger.write({
      level: "info",
      message: "シリーズの画像を並べ直した",
      details: { seriesId: input.id },
    });
  },
);
