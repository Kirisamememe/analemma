import { useConversionPolling } from "./use-conversion-polling";

import { useAppContext } from "@/api/app-context";
import { useApiCache, useApiQuery } from "@/api/server-state/server-state";
import { imageQueryKey, isConverting, loadImage } from "@/queries/image-query";
import { settleImageLists } from "@/queries/images-query";

/** 画像の取得の、失敗したときの扱いと、変換中に取り直す間隔。 */
type ImageQueryOptions = {
  /** 更新に失敗したときも、取得済みの内容を表示するか。 */
  readonly keepDataOnRefreshError?: boolean;
  /** 変換中の画像を取り直す間隔(ms)。 */
  readonly pollMs?: number;
};

/** ID で画像を取得し、変換中の間は、変換が終わるまで取り直す。 */
export const useImage = (
  id: string | null,
  { keepDataOnRefreshError = false, pollMs }: ImageQueryOptions = {},
) => {
  const { api } = useAppContext();
  const cache = useApiCache();

  const query = useApiQuery({
    key: imageQueryKey(id),
    keepDataOnRefreshError,
    load:
      id === null
        ? undefined
        : async () => {
            const loaded = await loadImage(api, id);

            await settleImageLists(cache, { id, loaded });

            return loaded;
          },
  });

  const converting =
    query._tag === "Loaded" &&
    query.data._tag === "Succeeded" &&
    isConverting(query.data.data)
      ? query.data
      : undefined;

  useConversionPolling(converting === undefined ? null : id, {
    pollMs,
    loaded: converting,
  });

  return query;
};
