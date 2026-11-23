import type { ApiClient } from "@/api/api-types";
import { callApi } from "@/api/call-api";

/** 写真1枚を送り、作った画像か、受けない形式だったか、セッションが切れたことを返す。 */
export const uploadPhoto = async (api: ApiClient, photo: File) => {
  const result = await callApi(api.admin.images.upload({ photo }), [
    "UNSUPPORTED_FORMAT",
    "UNAUTHORIZED",
  ]);

  if (result._tag === "Succeeded") {
    return { _tag: "Added", image: result.data } as const;
  }

  return result.code === "UNAUTHORIZED"
    ? ({ _tag: "SessionExpired", error: result.error } as const)
    : ({ _tag: "Unsupported" } as const);
};
