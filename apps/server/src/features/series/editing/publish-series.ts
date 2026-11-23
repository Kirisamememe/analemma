import { setPublished } from "@/features/series/editing/queries/series.query";
import { toAdminSeries } from "@/features/series/to-admin-series";
import { adminProcedures } from "@/procedures";

/** シリーズを公開する procedure。 */
export const publishSeries = adminProcedures.series.publish.handler(
  async ({ context, errors, input }) => {
    const row = await setPublished(context.db, {
      id: input.id,
      publishedAt: context.clock.now(),
    });

    if (row === undefined) throw errors.NOT_FOUND();

    context.logger.write({
      level: "info",
      message: "シリーズを公開した",
      details: { seriesId: input.id },
    });

    return toAdminSeries(row);
  },
);
