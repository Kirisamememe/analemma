import { useAppContext } from "@/api/app-context";
import { useApiQuery } from "@/api/server-state/server-state";
import { imageQueryKey, loadImage } from "@/queries/image-query";

/** ID で画像を取得する。 */
export const useImage = (
  id: string,
  { keepDataOnRefreshError = false } = {},
) => {
  const { api } = useAppContext();

  return useApiQuery({
    key: imageQueryKey(id),
    keepDataOnRefreshError,
    load: () => loadImage(api, id),
  });
};
