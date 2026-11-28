type ImagePage = Record<"images", readonly Record<"id", string>[]>;

/** 続きを読み終えた一覧の、最後のページの番号を返す。 */
export const lastPageIndex = (
  pages: readonly ImagePage[],
  hasNext: boolean,
): number | undefined =>
  !hasNext || pages.at(-1)?.images.length === 0 ? pages.length - 1 : undefined;

/** 一覧のページの key を、最初のページか、先頭の画像から決める。 */
export const imagePageKey = (
  images: ImagePage["images"],
  pageIndex: number,
): string | undefined => (pageIndex === 0 ? "first" : images[0]?.id);
