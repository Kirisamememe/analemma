import { toPublishedImage } from "@/features/images/to-image";
import { listPublishedSeriesRows } from "@/features/series/published/queries/published-series.query";
import { publicProcedures } from "@/procedures";

/** 公開しているシリーズとカバーの画像を、新しく作った順に返す procedure。 */
export const listPublishedSeries = publicProcedures.series.list.handler(
  async ({ context }) => {
    const rows = await listPublishedSeriesRows(context.db);
    const groups = Map.groupBy(rows, (row) => row.fields.slug);

    return {
      series: Array.from(groups.values()).flatMap((group) => {
        const [first] = group;

        if (!first) return [];

        return [
          {
            ...first.fields,
            imageCount: first.imageCount,
            coverImage:
              toPublishedImage(group, context.relyingParty.origin) ?? null,
          },
        ];
      }),
    };
  },
);
