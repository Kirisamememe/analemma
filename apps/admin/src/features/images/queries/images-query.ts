import type { ApiClient, ApiOutputs } from "@/api/api-types";

/** 画像の一覧の、query のキー。 */
export const IMAGES_QUERY_KEY = ["admin", "images", "list"] as const;

/** 一覧に出す、1つの画像。 */
export type ImageSummary =
  ApiOutputs["admin"]["images"]["list"]["images"][number];

/** 画像の一覧の1ページを読む(cursor を省くと最初のページ)。 */
export const loadImagesPage = (api: ApiClient, cursor: string | undefined) =>
  api.admin.images.list(cursor === undefined ? {} : { cursor });
