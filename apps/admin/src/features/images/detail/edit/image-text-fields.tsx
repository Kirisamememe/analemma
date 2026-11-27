import type { ReactNode } from "react";

import { imageTextSchemas } from "../logic/image-text";
import type { ImageEditor } from "./hooks/use-edit-image";

import { createFieldGuide } from "@/components/forms/logic/field-guide";
import { useLocale, useTranslate } from "@/i18n/use-translate";

/** タイトル・説明・alt の欄に渡す値。 */
type ImageTextFieldsProps = Pick<ImageEditor, "form" | "check" | "isSaving">;

/** 画像のタイトル・説明・alt の欄。 */
export const ImageTextFields = ({
  form,
  check,
  isSaving,
}: ImageTextFieldsProps): ReactNode => {
  const t = useTranslate();
  const guide = createFieldGuide(t, useLocale());

  return (
    <>
      <form.AppField name="title" validators={{ onChange: check("title") }}>
        {(field) => (
          <field.TextField
            autoComplete="off"
            placeholder={t("imageDetail.titlePlaceholder")}
            description={guide(imageTextSchemas.title)}
            isReadOnly={isSaving}
            label={t("imageDetail.title")}
          />
        )}
      </form.AppField>
      <form.AppField
        name="description"
        validators={{ onChange: check("description") }}
      >
        {(field) => (
          <field.TextArea
            isReadOnly={isSaving}
            label={t("imageDetail.description")}
            placeholder={t("imageDetail.descriptionPlaceholder")}
            description={guide(imageTextSchemas.description)}
          />
        )}
      </form.AppField>
      <form.AppField name="alt" validators={{ onChange: check("alt") }}>
        {(field) => (
          <field.TextField
            autoComplete="off"
            description={guide(imageTextSchemas.alt, {
              hint: t("imageDetail.guide.alt"),
            })}
            isReadOnly={isSaving}
            label={t("imageDetail.alt")}
          />
        )}
      </form.AppField>
    </>
  );
};
