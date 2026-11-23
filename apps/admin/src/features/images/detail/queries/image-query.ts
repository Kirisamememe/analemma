import type { ApiClient } from "@/api/api-types";
import { callApi } from "@/api/call-api";

/** 詳細の画面で開く画像の、query のキー。 */
export const imageQueryKey = (id: string) =>
  ["admin", "images", "get", id] as const;

/** 詳細の画面で開く画像を読む。 */
export const loadImage = (api: ApiClient, id: string) =>
  callApi(api.admin.images.get({ id }), ["NOT_FOUND"]);

/** 詳細の画面で開く画像を読んだ結果。 */
export type LoadedImage = Awaited<ReturnType<typeof loadImage>>;

/** 前後の画像の ID の、query のキーの頭。 */
export const IMAGE_NEIGHBORS_QUERY_KEY = [
  "admin",
  "images",
  "neighbors",
] as const;

/** 画像の前後の画像の ID の、query のキー。 */
export const imageNeighborsQueryKey = (id: string) =>
  [...IMAGE_NEIGHBORS_QUERY_KEY, id] as const;

/** 一覧の並びで、画像の前後の画像の ID を読む。 */
export const loadImageNeighbors = (api: ApiClient, id: string) =>
  callApi(api.admin.images.neighbors({ id }), ["NOT_FOUND"]);
