import type { ReactNode } from "react";

import { PHOTO_MAX_BYTES } from "@analemma/contract";

import type { PhotoUpload } from "./logic/photo-uploads";
import {
  formatFileSize,
  retryAction,
  toProgressTone,
  toStatusLabel,
} from "./logic/upload-view";

import { useLocale, useTranslate } from "@/i18n/use-translate";
import { Cluster, Text } from "@/ui/layout";
import { Badge } from "@/ui/primitives/badge";
import { Button } from "@/ui/primitives/button";
import { Link } from "@/ui/primitives/navigation";
import type { AppHref } from "@/ui/primitives/ui-provider";

type UploadPhotoStatusProps = {
  /** 選択中の写真。 */
  upload: PhotoUpload;
  /** 原稿の保存中は再送を止める。 */
  isSaving?: boolean;
  /** 失敗した写真の送信を再開する操作。 */
  retry: (id: number) => void;
  /** 送り直した後に focus を戻す操作。 */
  restore: (element: HTMLElement | null, upload: PhotoUpload) => void;
  /** 写真の詳細画面の行き先。 */
  imageHref: (id: string) => AppHref;
};

/** 選択した写真の送信状態と、その写真に対する操作。 */
export const UploadPhotoStatus = ({
  upload,
  isSaving = false,
  retry,
  restore,
  imageHref,
}: UploadPhotoStatusProps): ReactNode => {
  const t = useTranslate();
  const locale = useLocale();
  const action = retryAction(upload);

  return (
    <div
      ref={(element) => {
        restore(element, upload);
      }}
    >
      <Cluster align="center" gap={2}>
        {upload.imageId ? (
          <Link variant="forward" href={imageHref(upload.imageId)}>
            <Text as="span" variant="label">
              {upload.file.name}
            </Text>
            <span className="sr-only">{t("imageUpload.showPhoto")}</span>
          </Link>
        ) : (
          <Text variant="label">{upload.file.name}</Text>
        )}
        <Badge variant="soft" tone={toProgressTone(upload.status)}>
          {upload.status === "too-large"
            ? t("imageUpload.status.too-large", {
                limit: formatFileSize(locale, PHOTO_MAX_BYTES),
              })
            : t(toStatusLabel(upload.status))}
        </Badge>
        {upload.status === "converting" && (
          <Text as="span" tone="muted" variant="caption">
            {t("imageUpload.convertingHint")}
          </Text>
        )}
        {upload.status === "unreadable" && (
          <Text as="span" tone="muted" variant="caption">
            {t("imageUpload.unreadableHint")}
          </Text>
        )}
        {action !== "none" && (
          <Button
            size="sm"
            isDisabled={isSaving}
            isPending={action === "pending"}
            aria-label={t("imageUpload.retryPhoto", {
              name: upload.file.name,
            })}
            onPress={() => {
              retry(upload.id);
            }}
          >
            {t("imageUpload.retry")}
          </Button>
        )}
      </Cluster>
    </div>
  );
};
