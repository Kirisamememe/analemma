import type { ReactNode } from "react";

import { useUploadDialog } from "./hooks/use-upload-dialog";
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

/** 画像一覧の見出しと、写真を追加する Dialog。 */
export const PhotoUploads = ({ imageHref }: PhotoUploadsProps): ReactNode => {
  const t = useTranslate();

  const {
    page,
    attach,
    attachPanel,
    focus: { addButton, retry, restore },
    open,
    isOpen,
    setOpen,
    isDragging,
    receive,
    selected,
    canEditSelected,
    uploads,
    select,
    metadata,
    isUploading,
    problem,
    leaving,
  } = useUploadDialog();

  const notice = uploadNotice(uploads);

  return (
    <div ref={attach}>
      <PageHeader
        title={t("images.title")}
        description={t("images.description")}
        actions={
          <Button tone="primary" ref={addButton} onPress={open}>
            <Icon name="plus" />
            {t("imageUpload.add")}
          </Button>
        }
      />
      {isDragging && !isOpen && page && <PhotoDropHint page={page} />}
      <Dialog
        layout="wide"
        isOpen={isOpen}
        onOpenChange={setOpen}
        isPending={metadata.isSaving}
        title={t("imageUpload.title")}
        footer={{
          end: selected && (
            <DialogActions>
              <Button
                tone="primary"
                isPending={metadata.isSaving}
                isDisabled={isUploading}
                onPress={metadata.finish}
              >
                {t("imageUpload.finish")}
              </Button>
            </DialogActions>
          ),
        }}
      >
        {isDragging && <PhotoDropHint />}
        <DialogSection ref={attachPanel}>
          <Stack gap={3}>
            <UploadFileInput onFiles={receive} isDisabled={metadata.isSaving} />
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
        {selected && (
          <>
            <UploadCarousel
              uploads={uploads}
              selectedId={selected.id}
              onSelect={select}
            >
              <UploadPhotoStatus
                upload={selected}
                retry={retry}
                restore={restore}
                imageHref={imageHref}
              />
            </UploadCarousel>
            <DialogSection>
              <Stack gap={4}>
                {canEditSelected && (
                  <UploadPhotoFields
                    values={metadata.draft(selected.id)}
                    isReadOnly={metadata.isSaving}
                    onChange={(changes) => {
                      metadata.change(selected.id, changes);
                    }}
                  />
                )}
                {problem && (
                  <div role="alert">
                    <Text tone="danger">
                      {problem.name} · {t(problem.message)}
                    </Text>
                    {problem.show && (
                      <Button onPress={problem.show}>
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
      <UploadLeaveDialog leaving={leaving} />
    </div>
  );
};
