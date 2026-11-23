import { insertSeries } from "@/features/series/editing/queries/series.query";
import { toAdminSeries } from "@/features/series/to-admin-series";
import { adminProcedures } from "@/procedures";

/** シリーズを作る procedure。 */
export const createSeries = adminProcedures.series.create.handler(
  async ({ context, errors, input }) => {
    const row = await insertSeries(context.db, input);

    if (row === undefined) throw errors.SLUG_TAKEN();

    context.logger.write({
      level: "info",
      message: "シリーズを作った",
      details: { seriesId: row.id },
    });

    return toAdminSeries(row);
  },
);
