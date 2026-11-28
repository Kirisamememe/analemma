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
import {
  IMAGE_PICKER_KEY,
  IMAGES_QUERY_KEY,
  settleListedImage,
} from "@/queries/images-query";

const CONVERSION_POLL_MS = 2000;

/** 変換中の画像を、変換を終えるまで取り直し、結果を読み込んだ画像と一覧に当てる。 */
export const useConversionPolling = (
  id: string | null,
  pollMs = CONVERSION_POLL_MS,
): void => {
  const { api } = useAppContext();
  const { update, updatePages } = useApiCache();

  useApiPolling({
    key: conversionQueryKey(id),
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
            const listed = settleListedImage(id, loaded);
            const detail = settleLoadedImage(loaded);

            if (listed !== undefined) {
              await Promise.all([
                updatePages(IMAGES_QUERY_KEY, listed),
                updatePages(IMAGE_PICKER_KEY, listed),
              ]);
            }

            if (detail !== undefined) {
              await update<LoadedImage>(imageQueryKey(id), detail);
            }

            return loaded;
          },
  });
};
