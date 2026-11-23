import {
  imageNeighborsQueryKey,
  loadImageNeighbors,
} from "../queries/image-query";

import { useAppContext } from "@/api/app-context";
import { useApiQuery } from "@/api/server-state/server-state";

/** 一覧の並び(新しく足した順)で、前と次の画像の ID。 */
export type ImageNeighbors = {
  /** 前後の取得に失敗したときの状態と再試行。 */
  readonly failure?: Extract<
    ReturnType<typeof useApiQuery>,
    Record<"_tag", "Failed">
  >;
  /** 前(一つ新しい)の画像の ID。 */
  readonly previous: string | undefined;
  /** 次(一つ古い)の画像の ID。 */
  readonly next: string | undefined;
};

const NONE: ImageNeighbors = { previous: undefined, next: undefined };

/** 一覧で前後に並ぶ画像の ID を返す。 */
export const useImageNeighbors = (id: string): ImageNeighbors | undefined => {
  const { api } = useAppContext();

  const query = useApiQuery({
    key: imageNeighborsQueryKey(id),
    load: () => loadImageNeighbors(api, id),
  });

  if (query._tag === "Loading") return undefined;

  if (query._tag === "Failed") return { ...NONE, failure: query };

  if (query._tag !== "Loaded" || query.data._tag !== "Succeeded") return NONE;

  const { newer, older } = query.data.data;

  return { previous: newer ?? undefined, next: older ?? undefined };
};
