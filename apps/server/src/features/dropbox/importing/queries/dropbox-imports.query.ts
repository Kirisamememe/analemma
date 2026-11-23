import { inArray } from "drizzle-orm";

import { dropboxImport } from "@/db/schema/dropbox";
import type { DatabaseExecutor } from "@/platform/database";

/** 取り込んだ写真の記録。 */
export type ImportedPhoto = {
  /** 作った画像の ID(画像を消していれば null)。 */
  readonly imageId: string | null;
  /** 取り込んだ日時。 */
  readonly importedAt: Date;
};

/** content_hash ごとに、取り込んだ写真の記録を読む。 */
export const findImportedPhotos = async (
  db: DatabaseExecutor,
  contentHashes: readonly string[],
): Promise<Map<string, ImportedPhoto>> => {
  if (contentHashes.length === 0) return new Map();

  const rows = await db
    .select({
      contentHash: dropboxImport.contentHash,
      imageId: dropboxImport.imageId,
      importedAt: dropboxImport.importedAt,
    })
    .from(dropboxImport)
    .where(inArray(dropboxImport.contentHash, [...contentHashes]));

  return new Map(
    rows.map(({ contentHash, ...imported }) => [contentHash, imported]),
  );
};
