import type { ImageSummary } from "@/queries/images-query";

/** 画像を選ぶときの条件。 */
export type SelectionOptions = {
  /** 選べる枚数。 */
  mode: "single" | "multiple";
  /** すでに追加されている画像の ID。 */
  included?: ReadonlySet<string> | undefined;
  /** 削除された画像の ID。 */
  missing?: ReadonlySet<string> | undefined;
};

/** 選んだ順に保持する画像。 */
export type ImageSelection = ReadonlyMap<string, ImageSummary>;

/** 選択中の画像から、追加済みの画像と削除された画像を除く。 */
export const availableImages = (
  selected: ImageSelection,
  { included, missing }: SelectionOptions,
): ImageSummary[] =>
  Array.from(selected.values()).filter(
    ({ id }) => included?.has(id) !== true && missing?.has(id) !== true,
  );

type SelectionChange = SelectionOptions & {
  /** 選択・解除した画像。 */
  image: ImageSummary;
  /** 選んだ状態か。 */
  checked: boolean;
};

/** 写真の選択・解除を反映した一覧を返す。 */
export const changeSelection = (
  selected: ImageSelection,
  { image, checked, ...options }: SelectionChange,
): ImageSelection => {
  const next = new Map(
    options.mode === "single"
      ? []
      : availableImages(selected, options).map((item) => [item.id, item]),
  );

  if (checked) next.set(image.id, image);
  else next.delete(image.id);

  return next;
};
