import type { ReactNode } from "react";

import type { useUploadDialog } from "../hooks/use-upload-dialog";
import type { PhotoUpload } from "../logic/photo-uploads";
import { SelectedFields } from "./selected-fields";
import { UploadCarousel } from "./upload-carousel";
import { UploadPhotoStatus } from "./upload-photo-status";
import { UploadProblem } from "./upload-problem";

import { Stack } from "@/ui/layout";
import type { Href } from "@/ui/primitives/navigation";
import { ModalSection } from "@/ui/primitives/overlays";

type SelectedPhotoProps = {
  /** 写真を追加する Dialog の状態と操作。 */
  dialog: ReturnType<typeof useUploadDialog>;
  /** 選択中の写真。 */
  selected: PhotoUpload;
  /** 画像を見る画面への行き先を返す関数。 */
  imageHref: (id: string) => Href;
};

/** 送る写真のカルーセルと、選択中の写真の状態・入力欄・保存の誤り。 */
export const SelectedPhoto = ({
  dialog,
  selected,
  imageHref,
}: SelectedPhotoProps): ReactNode => (
  <>
    <UploadCarousel
      uploads={dialog.uploads}
      selectedId={selected.id}
      onSelect={dialog.select}
    >
      <UploadPhotoStatus
        isSaving={dialog.metadata.isSaving}
        upload={selected}
        retry={dialog.focus.retry}
        restore={dialog.focus.restore}
        imageHref={imageHref}
      />
    </UploadCarousel>
    <ModalSection>
      <Stack gap={4}>
        <SelectedFields upload={selected} metadata={dialog.metadata} />
        <UploadProblem problem={dialog.problem} />
      </Stack>
    </ModalSection>
  </>
);
