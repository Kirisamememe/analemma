import { type ImageText, toUpdateInput } from "../logic/image-text";

import type { ApiClient } from "@/api/api-types";
import { callApi } from "@/api/call-api";

/** 書き換える画像と、フォームの値。 */
export type ImageTextChange = {
  /** 画像の ID。 */
  readonly id: string;
  /** フォームの値。 */
  readonly values: ImageText;
};

/** 公開状態の変え方。 */
export type PublicationChange = {
  /** 画像の ID。 */
  readonly id: string;
  /** 公開するか(`false` なら非公開にする)。 */
  readonly published: boolean;
};

/** 画像のタイトル・説明・alt を、フォームの値で書き換える。 */
export const saveImage = async (
  api: ApiClient,
  { id, values }: ImageTextChange,
) => {
  const result = await callApi(
    api.admin.images.update({ id, ...toUpdateInput(values) }),
    ["NOT_FOUND"],
  );

  return result._tag === "Succeeded"
    ? ({ _tag: "Saved", image: result.data } as const)
    : ({ _tag: "NotFound" } as const);
};

/** 画像を公開するか、非公開にする。 */
export const setPublication = async (
  api: ApiClient,
  { id, published }: PublicationChange,
) => {
  const result = await callApi(
    published
      ? api.admin.images.publish({ id })
      : api.admin.images.unpublish({ id }),
    ["NOT_FOUND"],
  );

  if (result._tag === "Failed") return { _tag: "NotFound" } as const;

  return {
    _tag: result.data.published ? "Published" : "Unpublished",
    image: result.data,
  } as const;
};

/** 画像を削除する。 */
export const deleteImage = async (api: ApiClient, id: string) => {
  const result = await callApi(api.admin.images.delete({ id }), ["NOT_FOUND"]);

  return result._tag === "Succeeded"
    ? ({ _tag: "Deleted" } as const)
    : ({ _tag: "NotFound", missing: result } as const);
};
