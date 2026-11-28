import type { ApiClient, ApiOutputs } from "@/api/api-types";
import type { useApiCache } from "@/api/server-state/server-state";
import type { LoadedImage } from "@/queries/image-query";

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

/** 読み込んだ変換中の画像のうち、いちばん先に受け取った画像の ID を返す。 */
export const findNextConverting = (
  pages: readonly Record<
    "images",
    readonly Pick<ImageSummary, "id" | "status">[]
  >[],
): string | null => {
  const ids = pages.flatMap(({ images }) =>
    images.flatMap(({ id, status }) => (status === "processing" ? [id] : [])),
  );

  return ids.toSorted().at(0) ?? null;
};

/** 取り直した変換中の画像の結果から、読み込んだ一覧のその画像を書き換える関数を作る。 */
export const settleListedImage = (id: string, loaded: LoadedImage) => {
  if (loaded._tag === "Failed") return updateImagePage(id);

  const { status, publishedAt, deliveryImages } = loaded.data;

  return status === "processing"
    ? undefined
    : updateImagePage(id, (listed) =>
        listed.status === "processing"
          ? { ...listed, status, publishedAt, deliveryImages }
          : listed,
      );
};

/** 読んだ画像と、その結果。 */
type SettledImage = {
  /** 画像の ID。 */
  readonly id: string;
  /** 画像を読んだ結果。 */
  readonly loaded: LoadedImage;
};

/** 画像を読んだ結果を、読み込んだ一覧と、画像を選ぶ Dialog の一覧に当てる。 */
export const settleImageLists = async (
  { updatePages }: Pick<ReturnType<typeof useApiCache>, "updatePages">,
  { id, loaded }: SettledImage,
): Promise<void> => {
  const settle = settleListedImage(id, loaded);

  if (settle === undefined) return;

  await Promise.all([
    updatePages(IMAGES_QUERY_KEY, settle),
    updatePages(IMAGE_PICKER_KEY, settle),
  ]);
};
