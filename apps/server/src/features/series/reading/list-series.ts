import { listDeliveryImages } from "@/features/images/queries/delivery-images.query";
import { toAdminImage } from "@/features/images/to-admin-image";
import { listSeriesRows } from "@/features/series/reading/queries/series.query";
import { toAdminSeries } from "@/features/series/to-admin-series";
import { adminProcedures } from "@/procedures";

/** シリーズを新しく作った順に返す procedure。 */
export const listSeries = adminProcedures.series.list.handler(({ context }) =>
  context.db.transaction(
    async (tx) => {
      const rows = await listSeriesRows(tx);

      const coverIds = rows.flatMap(({ cover }) =>
        cover === null ? [] : [cover.id],
      );

      const deliveries = Map.groupBy(
        await listDeliveryImages(tx, coverIds),
        (item) => item.imageId,
      );

      return {
        series: rows.map(({ series, imageCount, cover }) => {
          const coverImage =
            cover === null
              ? null
              : toAdminImage(cover, deliveries.get(cover.id) ?? []);

          return Object.assign(toAdminSeries(series), {
            imageCount,
            coverImage,
          });
        }),
      };
    },
    { isolationLevel: "repeatable read", accessMode: "read only" },
  ),
);
