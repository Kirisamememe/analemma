import type { ApiClient } from "@/api/api-types";
import { callApi } from "@/api/call-api";

/** 前後の画像の ID の、query のキーの頭。 */
export const IMAGE_NEIGHBORS_QUERY_KEY = [
  "admin",
  "images",
  "neighbors",
] as const;

/** 画像の前後の画像の ID の、query のキー。 */
export const imageNeighborsQueryKey = (id: string) =>
  [...IMAGE_NEIGHBORS_QUERY_KEY, id.toLowerCase()] as const;

/** 一覧の並びで、画像の前後の画像の ID を読む。 */
export const loadImageNeighbors = (api: ApiClient, id: string) =>
  callApi(api.admin.images.neighbors({ id }), ["NOT_FOUND"]);
