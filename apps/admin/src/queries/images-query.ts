import type { ApiClient, ApiOutputs } from "@/api/api-types";

/** 画像の一覧の、query のキー。 */
export const IMAGES_QUERY_KEY = ["admin", "images", "list"] as const;

/** 画像を選ぶ Dialog の query のキー。 */
export const IMAGE_PICKER_KEY = ["admin", "images", "picker"] as const;

/** 一覧に出す、1つの画像。 */
export type ImageSummary =
  ApiOutputs["admin"]["images"]["list"]["images"][number];

/** 画像の一覧の1ページを読む。 */
export const loadImagesPage = (api: ApiClient, cursor: string | undefined) =>
  api.admin.images.list(cursor === undefined ? {} : { cursor });

/** 読み込んだページの画像を更新し、削除済みなら一覧から外す。 */
export const updateImagePage =
  (id: string, update?: (image: ImageSummary) => ImageSummary) =>
  (page: ApiOutputs["admin"]["images"]["list"]): typeof page => {
    if (!page.images.some((image) => image.id === id)) return page;

    const images =
      update === undefined
        ? page.images.filter((image) => image.id !== id)
        : page.images.map((image) => (image.id === id ? update(image) : image));

    return { ...page, images };
  };

/** 送った写真から作った画像を、一覧の最初のページに、新しく足した順を保って足す。 */
export const prependImage =
  (image: ImageSummary) =>
  (page: ApiOutputs["admin"]["images"]["list"], index: number): typeof page => {
    if (index !== 0 || page.images.some(({ id }) => id === image.id)) {
      return page;
    }

    const at = page.images.findIndex(({ id }) => id < image.id);

    return {
      ...page,
      images: page.images.toSpliced(at < 0 ? page.images.length : at, 0, image),
    };
  };
