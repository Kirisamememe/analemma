import { useAppContext } from "@/api/app-context";
import { useApiCache, useApiQuery } from "@/api/server-state/server-state";
import {
  imageQueryKey,
  isConverting,
  loadImage,
  type LoadedImage,
} from "@/queries/image-query";
import {
  IMAGE_PICKER_KEY,
  IMAGES_QUERY_KEY,
  settleListedImage,
} from "@/queries/images-query";

const CONVERSION_POLL_MS = 2000;

/** 画像の取得の、失敗したときの扱いと、変換中に取り直す間隔。 */
type ImageQueryOptions = {
  /** 更新に失敗したときも、取得済みの内容を表示するか。 */
  readonly keepDataOnRefreshError?: boolean;
  /** 変換中の画像を取り直す間隔(ms)。 */
  readonly pollMs?: number;
  /** 一覧で変換中と分かっている画像で、取得できるまで取り直し続けるか。 */
  readonly isListedAsConverting?: boolean;
};

/** ID で画像を取得し、変換中の間は、変換が終わるまで取り直す。 */
export const useImage = (
  id: string | null,
  {
    keepDataOnRefreshError = false,
    pollMs = CONVERSION_POLL_MS,
    isListedAsConverting = false,
  }: ImageQueryOptions = {},
) => {
  const { api } = useAppContext();
  const { updatePages } = useApiCache();

  const keepsPolling = (loaded: LoadedImage | undefined): boolean =>
    loaded === undefined
      ? isListedAsConverting
      : loaded._tag === "Succeeded" && isConverting(loaded.data);

  return useApiQuery({
    key: imageQueryKey(id),
    keepDataOnRefreshError,
    pollEvery: (loaded) => (keepsPolling(loaded) ? pollMs : false),
    load:
      id === null
        ? undefined
        : async () => {
            const loaded = await loadImage(api, id);
            const settle = settleListedImage(id, loaded);

            if (settle !== undefined) {
              await Promise.all([
                updatePages(IMAGES_QUERY_KEY, settle),
                updatePages(IMAGE_PICKER_KEY, settle),
              ]);
            }

            return loaded;
          },
  });
};
