import { readPublishedSeries } from "@/features/series/published/queries/published-series.query";
import { toPublishedSeries } from "@/features/series/published/to-published-series";
import { publicProcedures } from "@/procedures";

/** 公開しているシリーズを slug で返す procedure。 */
export const getPublishedSeries = publicProcedures.series.get.handler(
  async ({ context, errors, input }) => {
    const rows = await readPublishedSeries(context.db, input.slug);
    const series = toPublishedSeries(rows, context.relyingParty.origin);

    if (series === undefined) throw errors.NOT_FOUND();

    return series;
  },
);
