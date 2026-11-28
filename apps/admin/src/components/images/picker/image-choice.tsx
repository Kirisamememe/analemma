import type { ReactNode, Ref } from "react";

import { useImageChoice } from "../hooks/use-image-choice";

import { useTranslate } from "@/i18n/use-translate";
import type { ImageSummary } from "@/queries/images-query";
import { ImageRadio } from "@/ui/patterns";

/** 1枚の画像を選ぶ入力欄に渡す値。 */
type ImageChoiceProps = {
  /** この入力欄が選ぶ画像。 */
  image: ImageSummary;
  /** ページを読み込んだ後の focus の移動先。 */
  focus: Ref<HTMLInputElement>;
};

/** 一覧の1枚の画像を選ぶ、radio か checkbox の入力欄。 */
export const ImageChoice = ({ image, focus }: ImageChoiceProps): ReactNode => {
  const t = useTranslate();

  const { checked, disabled, group, type, missing, included, onChange } =
    useImageChoice(image);

  if (type === "radio") {
    return (
      <ImageRadio
        checked={checked}
        disabled={disabled}
        name={group}
        ref={focus}
        onChange={onChange}
      />
    );
  }

  const note = missing
    ? t("imageDetail.gone")
    : included && t("imagePicker.included");

  return (
    <span>
      <input
        checked={checked}
        disabled={disabled}
        name={group}
        ref={focus}
        type={type}
        onChange={onChange}
      />
      {note}
    </span>
  );
};
