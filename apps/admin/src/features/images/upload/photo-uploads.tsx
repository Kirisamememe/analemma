import { type ReactNode, useCallback, useSyncExternalStore } from "react";

import { useUploadConversions } from "./hooks/use-upload-conversions";
import { useUploadDialog } from "./hooks/use-upload-dialog";
import type { PhotoUpload } from "./logic/photo-uploads";
import { UploadCarousel } from "./upload-carousel";
import { UploadFileInput } from "./upload-file-input";
import { UploadLeaveDialog } from "./upload-leave-dialog";
import { UploadPhotoFields } from "./upload-photo-fields";
import { UploadPhotoStatus } from "./upload-photo-status";

import { PhotoDropHint } from "@/features/images/ui/upload/photo-drop-hint";
import { UploadNotice } from "@/features/images/ui/upload/upload-notice";
import { useTranslate } from "@/i18n/use-translate";
import { Stack, Text } from "@/ui/layout";
import { PageHeader } from "@/ui/patterns";
import { Button } from "@/ui/primitives/button";
import { Icon } from "@/ui/primitives/graphics";
import { Modal, ModalActions, ModalSection } from "@/ui/primitives/overlays";
import type { AppHref } from "@/ui/primitives/ui-provider";

type PhotoUploadsProps = {
  /** 画像を見る画面への行き先を返す関数。 */
  imageHref: (id: string) => AppHref;
};

type SelectedFieldsProps = {
  /** 入力中の写真。 */
  upload: PhotoUpload;
  /** 原稿を読み書きする先。 */
  metadata: ReturnType<typeof useUploadDialog>["metadata"];
};

const SelectedFields = ({ upload, metadata }: SelectedFieldsProps) => {
  const values = useSyncExternalStore(metadata.subscribe, () =>
    metadata.draft(upload.id),
  );

  const onChange = useCallback(
    (changes: Parameters<typeof metadata.change>[1]) => {
      metadata.change(upload.id, changes);
    },
    [metadata, upload.id],
  );

  if (
    (upload.status === "too-large" || upload.status === "unsupported") &&
    !metadata.hasChanges(upload.id)
  ) {
    return null;
  }

  return (
    <UploadPhotoFields
      values={values}
      isReadOnly={metadata.isSaving}
      onChange={onChange}
    />
  );
};

type ConversionsProps = Parameters<typeof useUploadConversions>[0];

const UploadConversions = (props: ConversionsProps): ReactNode => {
  useUploadConversions(props);

  return null;
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
          <>
            <UploadCarousel
              uploads={dialog.uploads}
              selectedId={dialog.selected.id}
              onSelect={dialog.select}
            >
              <UploadPhotoStatus
                isSaving={dialog.metadata.isSaving}
                upload={dialog.selected}
                retry={dialog.focus.retry}
                restore={dialog.focus.restore}
                imageHref={imageHref}
              />
            </UploadCarousel>
            <ModalSection>
              <Stack gap={4}>
                <SelectedFields
                  upload={dialog.selected}
                  metadata={dialog.metadata}
                />
                {dialog.problem && (
                  <div role="alert">
                    <Text tone="danger">
                      {t("imageUpload.problem", {
                        name: dialog.problem.name,
                        message: t(dialog.problem.message),
                      })}
                    </Text>
                    {dialog.problem.show && (
                      <Button onPress={dialog.problem.show}>
                        {t("imageUpload.editPhoto")}
                      </Button>
                    )}
                  </div>
                )}
              </Stack>
            </ModalSection>
          </>
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
