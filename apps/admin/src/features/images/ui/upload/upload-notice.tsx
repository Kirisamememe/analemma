import type { ReactNode } from "react";

import type { PhotoUpload } from "@/features/images/upload/logic/photo-uploads";
import { uploadNotice } from "@/features/images/upload/logic/upload-notice";
import { useTranslate } from "@/i18n/use-translate";
import { Stack, Text } from "@/ui/layout";
import { Notice } from "@/ui/primitives/notice";

type UploadNoticeProps = {
  /** 送る写真の一覧。 */
  uploads: readonly PhotoUpload[];
};

/** 送った写真の全体の進み具合と、状態ごとに次にできること。 */
export const UploadNotice = ({ uploads }: UploadNoticeProps): ReactNode => {
  const t = useTranslate();
  const notice = uploadNotice(uploads);

  if (notice === undefined) return null;

  return (
    <Notice icon={notice.icon} tone={notice.tone}>
      <Stack gap={0.5}>
        <Text variant="label">{t(notice.key, notice.counts)}</Text>
        {notice.details.map(({ key, count }) => (
          <Text key={key} variant="caption">
            {t(key, { count })}
          </Text>
        ))}
      </Stack>
    </Notice>
  );
};
