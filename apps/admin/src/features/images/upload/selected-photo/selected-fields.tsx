import { type ReactNode, useCallback, useSyncExternalStore } from "react";

import type { useUploadDialog } from "../hooks/use-upload-dialog";
import type { PhotoUpload } from "../logic/photo-uploads";
import { UploadPhotoFields } from "./upload-photo-fields";

type SelectedFieldsProps = {
  /** 入力中の写真。 */
  upload: PhotoUpload;
  /** 原稿を読み書きする先。 */
  metadata: ReturnType<typeof useUploadDialog>["metadata"];
};

/** 選択中の写真のタイトルと説明の入力欄(足せない写真には出さない)。 */
export const SelectedFields = ({
  upload,
  metadata,
}: SelectedFieldsProps): ReactNode => {
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
