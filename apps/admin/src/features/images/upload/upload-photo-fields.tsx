import type { ReactNode } from "react";

import { imageDescription, imageTitle } from "@analemma/contract";

import { createFieldGuide } from "@/components/forms/logic/field-guide";
import type { ImageText } from "@/features/images/detail/logic/image-text";
import { useLocale, useTranslate } from "@/i18n/use-translate";
import { Stack } from "@/ui/layout";
import { TextField, TextArea } from "@/ui/primitives/form-fields";

type Values = Pick<ImageText, "title" | "description">;

type UploadPhotoFieldsProps = {
  /** 選択した写真の現在の入力値。 */
  values: Values;
  /** 保存中で入力を保つか。 */
  isReadOnly: boolean;
  /** 管理者が書き換えた欄の新しい値を渡す先。 */
  onChange: (changes: Partial<Values>) => void;
};

/** 選択した写真のタイトルと説明の入力欄。 */
export const UploadPhotoFields = ({
  values,
  isReadOnly,
  onChange,
}: UploadPhotoFieldsProps): ReactNode => {
  const t = useTranslate();
  const guide = createFieldGuide(t, useLocale());

  return (
    <Stack gap={3}>
      <TextField
        name="title"
        label={t("imageDetail.title")}
        description={guide(imageTitle)}
        placeholder={t("imageDetail.titlePlaceholder")}
        value={values.title}
        isReadOnly={isReadOnly}
        onChange={(value) => {
          onChange({ title: value });
        }}
      />
      <TextArea
        name="description"
        label={t("imageDetail.description")}
        description={guide(imageDescription)}
        placeholder={t("imageDetail.descriptionPlaceholder")}
        value={values.description}
        isReadOnly={isReadOnly}
        onChange={(value) => {
          onChange({ description: value });
        }}
      />
    </Stack>
  );
};
