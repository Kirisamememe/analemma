import { memo, type ReactNode, useSyncExternalStore } from "react";

import type { UploadValue } from "./upload-value";

import {
  PhotoCarousel,
  TransferProgress,
} from "@/features/images/ui/upload/photo-carousel";
import type { PhotoUpload } from "@/features/images/upload/logic/photo-uploads";
import { useTranslate } from "@/i18n/use-translate";

/** 送る写真のカルーセルに渡す値。 */
type UploadCarouselProps = {
  /** 選択中の写真の状態と操作。 */
  children?: ReactNode;
  /** 送る写真の一覧。 */
  uploads: readonly PhotoUpload[];
  /** 編集中の写真の番号。 */
  selectedId: number;
  /** 編集する写真を選ぶ関数。 */
  onSelect: (id: number) => void;
};

type ProgressProps = {
  /** 送信試行ごとの転送率。 */
  progress: UploadValue<number>;
  /** 送信している写真の名前。 */
  label: string;
};

const UploadProgressContent = ({ progress, label }: ProgressProps) => {
  const percent = useSyncExternalStore(progress.subscribe, progress.read);

  return <TransferProgress percent={percent} label={label} />;
};

const UploadProgress = memo(UploadProgressContent);

/** まとめて送る写真から編集する1枚を選ぶ欄。 */
export const UploadCarousel = ({
  children,
  uploads,
  selectedId,
  onSelect,
}: UploadCarouselProps): ReactNode => {
  const t = useTranslate();
  return (
    <PhotoCarousel
      photos={uploads.map(({ id, file, previewUrl, status, progress }) => ({
        id,
        name: file.name,
        source: file,
        previewUrl,
        overlay: status === "sending" && progress && (
          <UploadProgress
            progress={progress}
            label={t("imageUpload.uploadingFile", { name: file.name })}
          />
        ),
      }))}
      selectedId={selectedId}
      onSelect={onSelect}
      label={t("imageUpload.selectPhoto")}
      previous={t("imageUpload.previousPhoto")}
      next={t("imageUpload.nextPhoto")}
      missing={t("imageUpload.noPreview")}
      position={(current, total) =>
        t("imageUpload.position", { current, total })
      }
    >
      {children}
    </PhotoCarousel>
  );
};
