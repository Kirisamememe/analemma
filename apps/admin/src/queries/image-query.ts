import type { ApiClient, ApiOutputs } from "@/api/api-types";
import { callApi } from "@/api/call-api";

/** 管理用 API が返す、1つの画像。 */
export type AdminImage = ApiOutputs["admin"]["images"]["get"];

/** 画像の、query のキー。 */
export const imageQueryKey = (id: string) =>
  ["admin", "images", "get", id.toLowerCase()] as const;

/** 画像を読む。 */
export const loadImage = (api: ApiClient, id: string) =>
  callApi(api.admin.images.get({ id }), ["NOT_FOUND"]);

/** 画像を読んだ結果。 */
export type LoadedImage = Awaited<ReturnType<typeof loadImage>>;
