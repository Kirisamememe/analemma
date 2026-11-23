import { listPublishedSeriesRows } from "@/features/series/published/queries/published-series.query";
import { toPublishedSeriesList } from "@/features/series/published/to-published-series";
import { publicProcedures } from "@/procedures";

/** 公開しているシリーズとカバーの画像を、新しく作った順に返す procedure。 */
export const listPublishedSeries = publicProcedures.series.list.handler(
  async ({ context }) => {
    const rows = await listPublishedSeriesRows(context.db);

    return toPublishedSeriesList(rows, context.relyingParty.origin);
  },
);
