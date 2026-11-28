import { readImageRelations } from "@/features/images/queries/image-relations.query";
import { toAdminImage } from "@/features/images/to-image";
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

      const relations = await readImageRelations(tx, coverIds);

      return {
        series: rows.map(({ series, imageCount, cover }) => {
          const coverImage =
            cover === null
              ? null
              : toAdminImage(cover, relations.get(cover.id));

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
