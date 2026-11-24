import { mergeImageChange } from "../logic/merge-image-change";
import { IMAGE_NEIGHBORS_QUERY_KEY } from "../queries/image-neighbors-query";

import { useApiCache } from "@/api/server-state/server-state";
import {
  type AdminImage,
  imageQueryKey,
  type LoadedImage,
} from "@/queries/image-query";
import { IMAGES_QUERY_KEY, updateImagePage } from "@/queries/images-query";

/** 画像を変えた応答を、写真を見る画面と一覧のキャッシュに当てる関数を返す。 */
export const useImageCache = () => {
  const { refresh, update, updatePages } = useApiCache();

  return {
    /** 書き換えか公開状態の変更の応答のうち、その操作が変えた欄を、詳細と一覧に当てる。 */
    applyChange: async (
      result: AdminImage,
      kind: "text" | "publication",
    ): Promise<void> => {
      const apply = mergeImageChange(result, kind);

      await Promise.all([
        update<LoadedImage>(imageQueryKey(result.id), (current) =>
          current._tag === "Succeeded"
            ? { ...current, data: apply(current.data) }
            : current,
        ),
        updatePages(IMAGES_QUERY_KEY, updateImagePage(result.id, apply)),
      ]);
    },
    /** 無くなった画像を、読み込んだ一覧から外す。 */
    dropFromList: (id: string): Promise<void> =>
      updatePages(IMAGES_QUERY_KEY, updateImagePage(id)),
    /** 画像の詳細を、server が返した「無い」という結果に替える。 */
    replaceImage: (
      id: string,
      result: Extract<LoadedImage, Record<"_tag", "Failed">>,
    ): Promise<void> => update<LoadedImage>(imageQueryKey(id), () => result),
    /** 画像の詳細を取り直す。 */
    refreshImage: (id: string, refetchType?: "all" | "active"): Promise<void> =>
      refresh(imageQueryKey(id), refetchType),
    /** 表示している一覧を取り直す。 */
    refreshList: (): Promise<void> => refresh(IMAGES_QUERY_KEY, "active"),
    /** 表示している写真の前後を取り直す。 */
    refreshNeighbors: (): Promise<void> =>
      refresh(IMAGE_NEIGHBORS_QUERY_KEY, "active"),
  };
};
