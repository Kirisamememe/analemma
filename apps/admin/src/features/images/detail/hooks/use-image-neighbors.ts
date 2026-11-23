import { useAppContext } from "@/api/app-context";
import { useApiInfiniteQuery } from "@/api/server-state/use-api-infinite-query";
import {
  IMAGES_QUERY_KEY,
  loadImagesPage,
} from "@/features/images/queries/images-query";

/** 一覧の並び(新しく足した順)で、前と次の画像の ID。 */
export type ImageNeighbors = {
  /** 前(一つ新しい)の画像の ID。 */
  readonly previous: string | undefined;
  /** 次(一つ古い)の画像の ID。 */
  readonly next: string | undefined;
};

const NONE: ImageNeighbors = { previous: undefined, next: undefined };

/** 読み込んだ一覧から、画像の前後の ID を返す(一覧に無ければどちらも undefined)。 */
export const useImageNeighbors = (id: string): ImageNeighbors => {
  const { api } = useAppContext();

  const list = useApiInfiniteQuery({
    key: IMAGES_QUERY_KEY,
    load: (cursor) => loadImagesPage(api, cursor),
    next: ({ nextCursor }) => nextCursor ?? undefined,
  });

  if (list._tag !== "Loaded") return NONE;

  const ids = list.pages.flatMap(({ images }) =>
    images.map((image) => image.id),
  );

  const index = ids.indexOf(id);

  return index < 0 ? NONE : { previous: ids[index - 1], next: ids[index + 1] };
};
