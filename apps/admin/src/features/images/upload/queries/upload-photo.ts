import { isUnavailable } from "@/api/api-errors";
import type { ApiClient, UploadProgressCallback } from "@/api/api-types";
import { callApi } from "@/api/call-api";

type PhotoRequest = {
  /** 送るファイル。 */
  photo: File;
  /** このファイルの転送率を受け取る関数。 */
  onUploadProgress?: UploadProgressCallback;
};

const send = async (
  api: ApiClient,
  { photo, onUploadProgress }: PhotoRequest,
) => {
  try {
    return await callApi(
      api.admin.images.upload({ photo }, { context: { onUploadProgress } }),
      ["UNSUPPORTED_FORMAT", "UNAUTHORIZED"],
    );
  } catch (error) {
    if (isUnavailable(error)) return { _tag: "Busy" } as const;

    throw error;
  }
};

/** 写真1枚を送り、作った画像か、受けない形式だったか、受付が埋まっていたか、セッションが切れたことを返す。 */
export const uploadPhoto = async (api: ApiClient, request: PhotoRequest) => {
  const result = await send(api, request);

  if (result._tag === "Busy") return result;

  if (result._tag === "Succeeded") {
    return { _tag: "Added", image: result.data } as const;
  }

  return result.code === "UNAUTHORIZED"
    ? ({ _tag: "SessionExpired", error: result.error } as const)
    : ({ _tag: "Unsupported" } as const);
};
