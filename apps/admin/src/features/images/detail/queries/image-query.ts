import type { ApiClient } from "@/api/api-types";
import { callApi } from "@/api/call-api";

/** 詳細の画面で開く画像の、query のキー。 */
export const imageQueryKey = (id: string) =>
  ["admin", "images", "get", id] as const;

/** 詳細の画面で開く画像を読む(無ければ NOT_FOUND の結果を返す)。 */
export const loadImage = (api: ApiClient, id: string) =>
  callApi(api.admin.images.get({ id }), ["NOT_FOUND"]);

/** 詳細の画面で開く画像を読んだ結果。 */
export type LoadedImage = Awaited<ReturnType<typeof loadImage>>;
