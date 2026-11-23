import { setPublished } from "@/features/series/editing/queries/series.query";
import { toAdminSeries } from "@/features/series/to-admin-series";
import { adminProcedures } from "@/procedures";

/** シリーズを非公開にする procedure。 */
export const unpublishSeries = adminProcedures.series.unpublish.handler(
  async ({ context, errors, input }) => {
    const row = await setPublished(context.db, {
      id: input.id,
      publishedAt: null,
    });

    if (row === undefined) throw errors.NOT_FOUND();

    context.logger.write({
      level: "info",
      message: "シリーズを非公開にした",
      details: { seriesId: input.id },
    });

    return toAdminSeries(row);
  },
);
