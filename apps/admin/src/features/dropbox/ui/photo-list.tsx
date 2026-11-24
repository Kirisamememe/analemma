import { memo, type ReactNode } from "react";

import { formatFileSize } from "@/components/photo-progress/logic/format-file-size";
import { PhotoProgressRow } from "@/components/photo-progress/photo-progress-row";
import { useDropboxPhotoRow } from "@/features/dropbox/hooks/use-dropbox-photo-row";
import { toStatusView } from "@/features/dropbox/logic/photo-status";
import { formatDateTime } from "@/i18n/format-date-time";
import { useLocale, useTranslate } from "@/i18n/use-translate";
import { ActionList } from "@/ui/primitives/collections";

/** 一覧に出す写真の ID を渡す値。 */
type PhotoListProps = {
  /** 写真の ID(一覧の順)。 */
  ids: readonly string[];
};

/** 写真1枚の ID を渡す値。 */
type DropboxPhotoRowProps = {
  /** Dropbox のファイルの ID。 */
  id: string;
};

const PHOTO_MAX_MEGABYTES = 64;

const PhotoRow = ({ id }: DropboxPhotoRowProps): ReactNode => {
  const t = useTranslate();
  const locale = useLocale();
  const row = useDropboxPhotoRow(id);

  if (row === undefined) return null;

  const { tone, busy } = toStatusView(row.status);

  return (
    <PhotoProgressRow
      busy={busy}
      detail={t("dropbox.photoDetail", {
        size: formatFileSize(locale, row.size),
        date: formatDateTime(locale, row.modifiedAt),
      })}
      href={row.imageId === null ? undefined : `/images/${row.imageId}`}
      name={row.path.replace(/^\//v, "")}
      status={
        row.status === "too-large"
          ? t("dropbox.status.too-large", { limit: PHOTO_MAX_MEGABYTES })
          : t(`dropbox.status.${row.status}`)
      }
      tone={tone}
    />
  );
};

/** App folder の写真1枚を、自分の状態が変わったときだけ描き直す行。 */
export const DropboxPhotoRow = memo(PhotoRow);

/** App folder の写真の一覧。 */
export const PhotoList = ({ ids }: PhotoListProps): ReactNode => (
  <ActionList>
    {ids.map((id) => (
      <DropboxPhotoRow id={id} key={id} />
    ))}
  </ActionList>
);
