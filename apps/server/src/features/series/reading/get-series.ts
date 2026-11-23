import { toAdminImage } from "@/features/images/to-image";
import { readSeriesRows } from "@/features/series/reading/queries/series.query";
import { toAdminSeries } from "@/features/series/to-admin-series";
import { adminProcedures } from "@/procedures";

/** シリーズと並び順どおりの画像を返す procedure。 */
export const getSeries = adminProcedures.series.get.handler(
  async ({ context, errors, input }) => {
    const rows = await readSeriesRows(context.db, input.id);
    const [first] = rows;

    if (first === undefined) throw errors.NOT_FOUND();

    const byImage = Map.groupBy(rows, (row) => row.image?.id);

    const images = Array.from(byImage.values()).flatMap((group) => {
      const image = group[0]?.image;

      if (!image) return [];

      const deliveries = group.flatMap(
        ({ deliveryImage }) => deliveryImage ?? [],
      );

      return [toAdminImage(image, deliveries)];
    });

    return { ...toAdminSeries(first.series), images };
  },
);
