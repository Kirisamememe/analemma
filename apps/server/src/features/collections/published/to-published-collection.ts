import type { ContractOutputs } from "@analemma/contract";

import type {
  readPublishedCollection,
  listPublishedCollectionRows,
} from "@/features/collections/published/queries/published-collections.query";
import { toPublishedImage } from "@/features/images/to-image";

type CollectionOutputs = ContractOutputs["public"]["collections"];
type CollectionRow = Awaited<
  ReturnType<typeof readPublishedCollection>
>[number];
type SummaryRow = Awaited<
  ReturnType<typeof listPublishedCollectionRows>
>[number];

/** コレクションとその画像の行を、公開サイトに返す形にする。 */
export const toPublishedCollection = (
  rows: readonly CollectionRow[],
  origin: string,
): CollectionOutputs["get"] | undefined => {
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

/** コレクションとカバーの画像の行を、公開サイトに返す一覧にする。 */
export const toPublishedCollectionList = (
  rows: readonly SummaryRow[],
  origin: string,
): CollectionOutputs["list"] => {
  const groups = Map.groupBy(rows, (row) => row.fields.slug);
  return {
    collections: Array.from(groups.values()).flatMap((group) => {
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
