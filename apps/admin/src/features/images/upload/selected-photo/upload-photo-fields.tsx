import { memo, type ReactNode } from "react";

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

type FieldProps = Pick<UploadPhotoFieldsProps, "isReadOnly" | "onChange"> & {
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
}: FieldProps) => {
  const t = useTranslate();
  const guide = createFieldGuide(t, useLocale());
  const Field = name === "title" ? TextField : TextArea;

  return (
    <Field
      name={name}
      label={t(`imageDetail.${name}`)}
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

const PhotoField = memo(PhotoFieldContent);

/** 選択した写真のタイトルと説明の入力欄。 */
export const UploadPhotoFields = ({
  values,
  isReadOnly,
  onChange,
}: UploadPhotoFieldsProps): ReactNode => (
  <Stack gap={3}>
    <PhotoField
      name="title"
      value={values.title}
      isReadOnly={isReadOnly}
      onChange={onChange}
    />
    <PhotoField
      name="description"
      value={values.description}
      isReadOnly={isReadOnly}
      onChange={onChange}
    />
  </Stack>
);
