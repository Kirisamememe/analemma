import { replaceSeries } from "@/features/series/editing/queries/series.query";
import { toAdminSeries } from "@/features/series/to-admin-series";
import { adminProcedures } from "@/procedures";

/** シリーズの名前・slug・説明を書き換える procedure。 */
export const updateSeries = adminProcedures.series.update.handler(
  async ({ context, errors, input }) => {
    const result = await replaceSeries(context.db, input);

    if (result._tag === "Missing") throw errors.NOT_FOUND();

    if (result._tag === "SlugTaken") throw errors.SLUG_TAKEN();

    context.logger.write({
      level: "info",
      message: "シリーズを書き換えた",
      details: { seriesId: input.id },
    });

    return toAdminSeries(result.row);
  },
);
