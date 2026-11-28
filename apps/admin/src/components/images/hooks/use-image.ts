import { useConversionPolling } from "./use-conversion-polling";

import { useAppContext } from "@/api/app-context";
import { useApiQuery } from "@/api/server-state/server-state";
import { imageQueryKey, isConverting, loadImage } from "@/queries/image-query";

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

  const query = useApiQuery({
    key: imageQueryKey(id),
    keepDataOnRefreshError,
    load: id === null ? undefined : async () => loadImage(api, id),
  });

  const converting =
    query._tag === "Loaded" &&
    query.data._tag === "Succeeded" &&
    isConverting(query.data.data);

  useConversionPolling(converting ? id : null, pollMs);

  return query;
};
