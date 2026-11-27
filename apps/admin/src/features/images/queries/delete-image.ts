import type { ApiClient } from "@/api/api-types";
import { callApi } from "@/api/call-api";

/** 画像を削除する。 */
export const deleteImage = (api: ApiClient, id: string) =>
  callApi(api.admin.images.delete({ id }), ["NOT_FOUND"]);
