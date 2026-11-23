import { deleteSeriesRow } from "@/features/series/editing/queries/series.query";
import { adminProcedures } from "@/procedures";

/** シリーズを消す procedure。 */
export const deleteSeries = adminProcedures.series.delete.handler(
  async ({ context, errors, input }) => {
    if (!(await deleteSeriesRow(context.db, input.id))) {
      throw errors.NOT_FOUND();
    }

    context.logger.write({
      level: "info",
      message: "シリーズを消した",
      details: { seriesId: input.id },
    });
  },
);
