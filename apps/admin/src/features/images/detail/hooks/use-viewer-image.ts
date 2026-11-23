import { imageQueryKey, loadImage } from "../queries/image-query";

import { useAppContext } from "@/api/app-context";
import { useApiQuery } from "@/api/server-state/server-state";

/** ビューアに開いた画像を取得する。 */
export const useViewerImage = (id: string) => {
  const { api } = useAppContext();

  return useApiQuery({
    key: imageQueryKey(id),
    load: () => loadImage(api, id),
  });
};
