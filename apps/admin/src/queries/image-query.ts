import type { ApiClient, ApiOutputs } from "@/api/api-types";
import { callApi } from "@/api/call-api";

/** 管理用 API が返す、1つの画像。 */
export type AdminImage = ApiOutputs["admin"]["images"]["get"];

/** 画像の、query のキー。 */
export const imageQueryKey = (id: string | null) =>
  ["admin", "images", "get", id?.toLowerCase() ?? null] as const;

/** 画像を読む。 */
export const loadImage = (api: ApiClient, id: string) =>
  callApi(api.admin.images.get({ id }), ["NOT_FOUND"]);

/** 画像を読んだ結果。 */
export type LoadedImage = Awaited<ReturnType<typeof loadImage>>;

/** 画像の変換が終わるのを待っているか。 */
export const isConverting = (image: Pick<AdminImage, "status">): boolean =>
  image.status === "processing";

/** 画像の変換を終えて、公開か非公開にできるか。 */
export const isConverted = (image: Pick<AdminImage, "status">): boolean =>
  image.status === "published" || image.status === "unpublished";
