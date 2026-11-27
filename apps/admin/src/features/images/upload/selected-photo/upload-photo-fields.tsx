import type { ReactNode } from "react";

import { PhotoField } from "./photo-field";

import type { ImageText } from "@/features/images/detail/logic/image-text";
import { Stack } from "@/ui/layout";

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
