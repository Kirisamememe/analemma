import type { ReactNode } from "react";

import type { ImageEditor } from "./hooks/use-edit-image";
import { ImageTextFields } from "./image-text-fields";

import { useTranslate } from "@/i18n/use-translate";
import { Cluster } from "@/ui/layout";
import { Button } from "@/ui/primitives/button";

/** タイトル・説明・alt のフォームに渡す値。 */
type EditImageFormProps = Pick<
  ImageEditor,
  "form" | "check" | "isSaving" | "requestClose"
>;

/** 画像のタイトル・説明・alt の欄と、キャンセルと保存の操作。 */
export const EditImageForm = ({
  form,
  check,
  isSaving,
  requestClose,
}: EditImageFormProps): ReactNode => {
  const t = useTranslate();

  return (
    <form.AppForm>
      <form.Form isPending={isSaving}>
        <ImageTextFields form={form} check={check} isSaving={isSaving} />
        <Cluster gap={2} justify="end">
          <Button isDisabled={isSaving} onPress={requestClose}>
            {t("imageDetail.cancel")}
          </Button>
          <Button
            pendingLabel={t("ui.pending")}
            isPending={isSaving}
            tone="primary"
            type="submit"
          >
            {t("imageDetail.save")}
          </Button>
        </Cluster>
      </form.Form>
    </form.AppForm>
  );
};
