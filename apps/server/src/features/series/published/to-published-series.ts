import type { ContractOutputs } from "@analemma/contract";

import { toPublishedImage } from "@/features/images/to-image";
import type {
  readPublishedSeries,
  listPublishedSeriesRows,
} from "@/features/series/published/queries/published-series.query";

type SeriesOutputs = ContractOutputs["public"]["series"];
type SeriesRow = Awaited<ReturnType<typeof readPublishedSeries>>[number];
type SummaryRow = Awaited<ReturnType<typeof listPublishedSeriesRows>>[number];

/** シリーズとその画像の行を、公開サイトに返す形にする。 */
export const toPublishedSeries = (
  rows: readonly SeriesRow[],
  origin: string,
): SeriesOutputs["get"] | undefined => {
  const [first] = rows;

  if (first === undefined) return undefined;

  const groups = Map.groupBy(rows, (row) => row.image?.id);

  return {
    ...first.fields,
    images: Array.from(groups.values()).flatMap(
      (group) => toPublishedImage(group, origin) ?? [],
    ),
  };
};

/** シリーズとカバーの画像の行を、公開サイトに返す一覧にする。 */
export const toPublishedSeriesList = (
  rows: readonly SummaryRow[],
  origin: string,
): SeriesOutputs["list"] => {
  const groups = Map.groupBy(rows, (row) => row.fields.slug);
  return {
    series: Array.from(groups.values()).flatMap((group) => {
      const [first] = group;

      if (first === undefined) return [];

      return [
        {
          ...first.fields,
          imageCount: first.imageCount,
          coverImage: toPublishedImage(group, origin) ?? null,
        },
      ];
    }),
  };
};
