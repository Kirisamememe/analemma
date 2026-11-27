import type { ReactNode } from "react";

import { useUploadDialog } from "./hooks/use-upload-dialog";
import { SelectedPhoto } from "./selected-photo/selected-photo";
import { UploadConversions } from "./upload-conversions";
import { UploadFileInput } from "./upload-file-input";
import { UploadLeaveDialog } from "./upload-leave-dialog";

import { PhotoDropHint } from "@/features/images/ui/upload/photo-drop-hint";
import { UploadNotice } from "@/features/images/ui/upload/upload-notice";
import { useTranslate } from "@/i18n/use-translate";
import { Stack } from "@/ui/layout";
import { PageHeader } from "@/ui/patterns";
import { Button } from "@/ui/primitives/button";
import { Icon } from "@/ui/primitives/graphics";
import { Modal, ModalActions, ModalSection } from "@/ui/primitives/overlays";
import type { AppHref } from "@/ui/primitives/ui-provider";

type PhotoUploadsProps = {
  /** 画像を見る画面への行き先を返す関数。 */
  imageHref: (id: string) => AppHref;
};

/** 画像一覧の見出しと、写真を追加する Dialog。 */
export const PhotoUploads = ({ imageHref }: PhotoUploadsProps): ReactNode => {
  const t = useTranslate();

  const dialog = useUploadDialog();

  const {
    attach,
    attachPanel,
    focus: { addButton },
  } = dialog;

  return (
    <div ref={attach}>
      <UploadConversions uploads={dialog.uploads} onSettled={dialog.settle} />
      <PageHeader
        title={t("images.title")}
        description={t("images.description")}
        actions={
          <Button tone="primary" ref={addButton} onPress={dialog.open}>
            <Icon name="plus" />
            {t("imageUpload.add")}
          </Button>
        }
      />
      {dialog.isDragging && !dialog.isOpen && dialog.page && (
        <PhotoDropHint page={dialog.page} />
      )}
      <Modal
        isOpen={dialog.isOpen}
        onOpenChange={dialog.setOpen}
        isPending={dialog.metadata.isSaving}
        title={t("imageUpload.title")}
        footer={{
          end: dialog.selected && (
            <ModalActions>
              <Button
                tone="primary"
                isPending={dialog.metadata.isSaving}
                isDisabled={dialog.isUploading}
                onPress={dialog.finish}
              >
                {t("imageUpload.finish")}
              </Button>
            </ModalActions>
          ),
        }}
      >
        {dialog.isDragging && <PhotoDropHint />}
        <ModalSection ref={attachPanel}>
          <Stack gap={3}>
            <UploadFileInput
              onFiles={dialog.receive}
              isDisabled={dialog.metadata.isSaving}
            />
            <UploadNotice uploads={dialog.uploads} />
          </Stack>
        </ModalSection>
        {dialog.selected && (
          <SelectedPhoto
            dialog={dialog}
            imageHref={imageHref}
            selected={dialog.selected}
          />
        )}
      </Modal>
      <UploadLeaveDialog leaving={dialog.leaving} />
      <UploadLeaveDialog
        leaving={dialog.discarding}
        discarded={dialog.discarding.count}
      />
    </div>
  );
};
