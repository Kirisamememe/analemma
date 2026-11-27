import type { ReactNode } from "react";

import { DiscardDialog } from "./discard-dialog";
import { EditImageForm } from "./edit-image-form";
import {
  type EditImageDialogProps,
  useEditImage,
} from "./hooks/use-edit-image";

import { useTranslate } from "@/i18n/use-translate";
import { Dialog } from "@/ui/primitives/overlays";

/** 画像のタイトル・説明・alt を編集する Dialog。 */
export const EditImageDialog = (props: EditImageDialogProps): ReactNode => {
  const t = useTranslate();
  const editor = useEditImage(props);

  return (
    <>
      <Dialog
        isOpen
        isPending={editor.isSaving}
        onOpenChange={(open) => {
          if (!open) editor.requestClose();
        }}
        title={t("imageDetail.editTitle")}
      >
        <EditImageForm
          form={editor.form}
          check={editor.check}
          isSaving={editor.isSaving}
          requestClose={editor.requestClose}
        />
      </Dialog>
      <DiscardDialog
        confirmation={editor.confirmation}
        stay={editor.stay}
        discard={editor.discard}
      />
    </>
  );
};
