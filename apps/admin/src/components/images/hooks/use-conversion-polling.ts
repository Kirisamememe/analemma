import { useAppContext } from "@/api/app-context";
import { useApiCache } from "@/api/server-state/server-state";
import { useApiPolling } from "@/api/server-state/use-api-polling";
import {
  conversionQueryKey,
  imageQueryKey,
  isConverting,
  loadImage,
  type LoadedImage,
  settleLoadedImage,
} from "@/queries/image-query";
import { settleImageLists } from "@/queries/images-query";

const CONVERSION_POLL_MS = 2000;

/** 変換中の画像を取り直す間隔と、読んである結果。 */
type ConversionPollingOptions = {
  /** 変換中の画像を取り直す間隔(ms)。 */
  readonly pollMs?: number | undefined;
  /** 最初の取り直しを、1回分の間隔だけ遅らせる、読んである画像。 */
  readonly loaded?: LoadedImage | undefined;
};

/** 変換中の画像を、変換を終えるまで取り直し、結果を読み込んだ画像と一覧に当てる。 */
export const useConversionPolling = (
  id: string | null,
  { pollMs = CONVERSION_POLL_MS, loaded: seed }: ConversionPollingOptions = {},
): void => {
  const { api } = useAppContext();
  const cache = useApiCache();

  useApiPolling({
    key: conversionQueryKey(id),
    ...(seed !== undefined && { seed }),
    every: (loaded) =>
      loaded === undefined ||
      (loaded._tag === "Succeeded" && isConverting(loaded.data))
        ? pollMs
        : false,
    load:
      id === null
        ? undefined
        : async () => {
            const loaded = await loadImage(api, id);
            const detail = settleLoadedImage(loaded);

            await settleImageLists(cache, { id, loaded });

            if (detail !== undefined) {
              await cache.update<LoadedImage>(imageQueryKey(id), detail);
            }

            return loaded;
          },
  });
};
