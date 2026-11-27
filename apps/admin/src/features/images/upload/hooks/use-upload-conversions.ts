import { useAppContext } from "@/api/app-context";
import { useApiCache, useApiQuery } from "@/api/server-state/server-state";
import {
  type PhotoUpload,
  nextConverting,
} from "@/features/images/upload/logic/photo-uploads";
import {
  type AdminImage,
  isConverting,
  loadImage,
} from "@/queries/image-query";
import {
  IMAGE_PICKER_KEY,
  IMAGES_QUERY_KEY,
  settleListedImage,
} from "@/queries/images-query";

const CONVERSION_POLL_MS = 2000;

/** 送った写真の一覧と、変換の結果を受け取る関数。 */
type UploadConversions = {
  /** 送る写真の一覧。 */
  readonly uploads: readonly PhotoUpload[];
  /** 変換の結果(無くなっていたら undefined)を、写真に当てる関数。 */
  readonly onSettled: (id: number, image: AdminImage | undefined) => void;
  /** 変換中の画像を取り直す間隔(ms)。 */
  readonly pollMs?: number;
};

/** 送った写真のうち、いちばん先に受け取られた変換中の1枚の結果を取り直す。 */
export const useUploadConversions = ({
  uploads,
  onSettled,
  pollMs = CONVERSION_POLL_MS,
}: UploadConversions): void => {
  const { api } = useAppContext();
  const { updatePages } = useApiCache();
  const next = nextConverting(uploads);

  useApiQuery({
    key: ["admin", "images", "upload-conversion", next?.imageId ?? null],
    pollEvery: () => pollMs,
    load:
      next === undefined
        ? undefined
        : async () => {
            const loaded = await loadImage(api, next.imageId);
            const settle = settleListedImage(next.imageId, loaded);

            if (settle !== undefined) {
              await Promise.all([
                updatePages(IMAGES_QUERY_KEY, settle),
                updatePages(IMAGE_PICKER_KEY, settle),
              ]);
            }

            if (loaded._tag === "Failed") onSettled(next.id, undefined);
            else if (!isConverting(loaded.data)) {
              onSettled(next.id, loaded.data);
            }

            return loaded;
          },
  });
};
