import type { ContractOutputs } from "@analemma/contract";

import type { ImportedPhoto } from "@/features/dropbox/importing/queries/dropbox-imports.query";
import type { DropboxFile } from "@/platform/dropbox/dropbox-api";

/** 管理画面に返す、App folder の写真。 */
export type DropboxPhoto =
  ContractOutputs["admin"]["dropbox"]["photos"]["photos"][number];

const PHOTO_EXTENSION = /\.(?:jpe?g|png|webp|avif|heic|heif)$/iv;

/** App folder のファイルから、取り込める形式の拡張子を持つ写真だけを、新しく変わった順に選ぶ。 */
export const selectFolderPhotos = (
  files: readonly DropboxFile[],
): DropboxFile[] =>
  files
    .filter(({ path }) => PHOTO_EXTENSION.test(path))
    .toSorted(
      (a, b) =>
        b.modifiedAt.getTime() - a.modifiedAt.getTime() ||
        a.path.localeCompare(b.path),
    );

/** App folder の写真を、取り込んだ記録と合わせて、管理画面に返す形にする。 */
export const toDropboxPhoto = (
  file: DropboxFile,
  imported: ImportedPhoto | undefined,
): DropboxPhoto => ({
  id: file.id,
  path: file.path,
  size: file.size,
  modifiedAt: file.modifiedAt.toISOString(),
  contentHash: file.contentHash,
  imported:
    imported === undefined
      ? null
      : {
          imageId: imported.imageId,
          importedAt: imported.importedAt.toISOString(),
        },
});
