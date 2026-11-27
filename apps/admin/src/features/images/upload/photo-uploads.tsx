import { type ReactNode, useCallback, useSyncExternalStore } from "react";

import { useUploadDialog } from "./hooks/use-upload-dialog";
import type { PhotoUpload } from "./logic/photo-uploads";
import { uploadNotice } from "./logic/upload-view";
import { UploadCarousel } from "./upload-carousel";
import { UploadFileInput } from "./upload-file-input";
import { UploadLeaveDialog } from "./upload-leave-dialog";
import { UploadPhotoFields } from "./upload-photo-fields";
import { UploadPhotoStatus } from "./upload-photo-status";

import { PhotoDropHint } from "@/features/images/ui/upload/photo-drop-hint";
import { useTranslate } from "@/i18n/use-translate";
import { Cluster, Stack, Text } from "@/ui/layout";
import { PageHeader } from "@/ui/patterns";
import { Button } from "@/ui/primitives/button";
import { Icon } from "@/ui/primitives/graphics";
import { Notice } from "@/ui/primitives/notice";
import { Dialog, DialogActions, DialogSection } from "@/ui/primitives/overlays";
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

/** 画像一覧の見出しと、写真を追加する Dialog。 */
export const PhotoUploads = ({ imageHref }: PhotoUploadsProps): ReactNode => {
  const t = useTranslate();

  const dialog = useUploadDialog();

  const {
    attach,
    attachPanel,
    focus: { addButton },
  } = dialog;

  const notice = uploadNotice(dialog.uploads);

  return (
    <div ref={attach}>
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
      <Dialog
        layout="wide"
        isOpen={dialog.isOpen}
        onOpenChange={dialog.setOpen}
        isPending={dialog.metadata.isSaving}
        title={t("imageUpload.title")}
        footer={{
          end: dialog.selected && (
            <DialogActions>
              <Button
                tone="primary"
                isPending={dialog.metadata.isSaving}
                isDisabled={dialog.isUploading}
                onPress={dialog.finish}
              >
                {t("imageUpload.finish")}
              </Button>
            </DialogActions>
          ),
        }}
      >
        {dialog.isDragging && <PhotoDropHint />}
        <DialogSection ref={attachPanel}>
          <Stack gap={3}>
            <UploadFileInput
              onFiles={dialog.receive}
              isDisabled={dialog.metadata.isSaving}
            />
            {notice && (
              <Notice tone={notice.tone}>
                <Cluster gap={2}>
                  <Icon name={notice.icon} />
                  <Text>{t(notice.key, notice.counts)}</Text>
                </Cluster>
              </Notice>
            )}
          </Stack>
        </DialogSection>
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
            <DialogSection>
              <Stack gap={4}>
                <SelectedFields
                  upload={dialog.selected}
                  metadata={dialog.metadata}
                />
                {dialog.problem && (
                  <div role="alert">
                    <Text tone="danger">
                      {dialog.problem.name} · {t(dialog.problem.message)}
                    </Text>
                    {dialog.problem.show && (
                      <Button onPress={dialog.problem.show}>
                        {t("imageUpload.editPhoto")}
                      </Button>
                    )}
                  </div>
                )}
              </Stack>
            </DialogSection>
          </>
        )}
      </Dialog>
      <UploadLeaveDialog leaving={dialog.leaving} />
      <UploadLeaveDialog
        leaving={dialog.discarding}
        discarded={dialog.discarding.count}
      />
    </div>
  );
};
