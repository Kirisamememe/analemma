import { memo, type ReactNode } from "react";

import { imageDescription, imageTitle } from "@analemma/contract";

import { createFieldGuide } from "@/components/forms/logic/field-guide";
import type { ImageText } from "@/features/images/detail/logic/image-text";
import { useLocale, useTranslate } from "@/i18n/use-translate";
import { TextField, TextArea } from "@/ui/primitives/form-fields";

type Values = Pick<ImageText, "title" | "description">;

/** タイトルか説明の1つの欄に渡す値。 */
type PhotoFieldProps = {
  /** 保存中で入力を保つか。 */
  isReadOnly: boolean;
  /** 管理者が書き換えた欄の新しい値を渡す先。 */
  onChange: (changes: Partial<Values>) => void;
  /** 入力する欄の名前。 */
  name: keyof Values;
  /** この欄の入力値。 */
  value: string;
};

const PhotoFieldContent = ({
  name,
  value,
  isReadOnly,
  onChange,
}: PhotoFieldProps): ReactNode => {
  const t = useTranslate();
  const guide = createFieldGuide(t, useLocale());
  const Field = name === "title" ? TextField : TextArea;

  return (
    <Field
      name={name}
      label={t(`imageDetail.${name}`)}
      optionalLabel={t("ui.optional")}
      description={guide(name === "title" ? imageTitle : imageDescription)}
      placeholder={t(`imageDetail.${name}Placeholder`)}
      value={value}
      isReadOnly={isReadOnly}
      onChange={(next) => {
        onChange({ [name]: next });
      }}
    />
  );
};

/** 選択した写真のタイトルか説明の、1つの入力欄。 */
export const PhotoField = memo(PhotoFieldContent);
