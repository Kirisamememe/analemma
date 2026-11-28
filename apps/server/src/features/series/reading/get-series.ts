import { readImageRelations } from "@/features/images/queries/image-relations.query";
import { toAdminImage } from "@/features/images/to-image";
import { readSeriesRows } from "@/features/series/reading/queries/series.query";
import { toAdminSeries } from "@/features/series/to-admin-series";
import { adminProcedures } from "@/procedures";

/** シリーズと並び順どおりの画像を返す procedure。 */
export const getSeries = adminProcedures.series.get.handler(
  ({ context, errors, input }) =>
    context.db.transaction(
      async (tx) => {
        const rows = await readSeriesRows(tx, input.id);
        const [first] = rows;

        if (first === undefined) throw errors.NOT_FOUND();

        const members = rows.flatMap(({ image }) => image ?? []);

        const relations = await readImageRelations(
          tx,
          members.map(({ id }) => id),
        );

        return {
          ...toAdminSeries(first.series),
          images: members.map((row) =>
            toAdminImage(row, relations.get(row.id)),
          ),
        };
      },
      { isolationLevel: "repeatable read", accessMode: "read only" },
    ),
);
