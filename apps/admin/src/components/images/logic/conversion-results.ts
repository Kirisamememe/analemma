import type { ImageSummary } from "@/queries/images-query";

type Listed = Pick<ImageSummary, "id" | "status" | "title">;
type Pages = readonly Record<"images", readonly Listed[]>[];

/** 読み込んだ画像のうち、変換中のものの ID を集める。 */
export const convertingIds = (pages: Pages): ReadonlySet<string> =>
  new Set(
    pages.flatMap(({ images }) =>
      images.flatMap(({ id, status }) => (status === "processing" ? [id] : [])),
    ),
  );

/** 前に変換中だった画像のうち、変換を終えて一覧に残っているものを返す。 */
export const settledSince = (
  watched: ReadonlySet<string>,
  pages: Pages,
): readonly Listed[] =>
  pages.flatMap(({ images }) =>
    images.filter(
      ({ id, status }) => watched.has(id) && status !== "processing",
    ),
  );

/** 変換を終えた画像が、配信用の画像を作れたかを返す。 */
export const isConverted = ({ status }: Pick<Listed, "status">): boolean =>
  status === "published" || status === "unpublished";
