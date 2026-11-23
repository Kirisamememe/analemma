import { toPublishedImage } from "@/features/images/to-image";
import { readPublishedSeries } from "@/features/series/published/queries/published-series.query";
import { publicProcedures } from "@/procedures";

/** 公開しているシリーズを slug で返す procedure。 */
export const getPublishedSeries = publicProcedures.series.get.handler(
  async ({ context, errors, input }) => {
    const rows = await readPublishedSeries(context.db, input.slug);
    const [first] = rows;

    if (first === undefined) throw errors.NOT_FOUND();

    return {
      ...first.fields,
      images: Array.from(
        Map.groupBy(rows, (row) => row.image?.id).values(),
      ).flatMap(
        (group) => toPublishedImage(group, context.relyingParty.origin) ?? [],
      ),
    };
  },
);
