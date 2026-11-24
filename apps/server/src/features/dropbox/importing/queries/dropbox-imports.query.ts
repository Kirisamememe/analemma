import { inArray } from "drizzle-orm";

import { dropboxImport } from "@/db/schema/dropbox";
import type { DatabaseExecutor } from "@/platform/database";

/** 取り込んだ写真の記録。 */
export type ImportedPhoto = Readonly<
  Pick<typeof dropboxImport.$inferSelect, "imageId" | "importedAt">
>;

const CHUNK = 1000; // SQL の引数の数の上限(65535)に収める

/** 新しく取り込んだ写真の記録。 */
export type NewImportedPhoto = typeof dropboxImport.$inferInsert;

/** content_hash ごとに、取り込んだ写真の記録を読む。 */
export const findImportedPhotos = async (
  db: DatabaseExecutor,
  contentHashes: readonly string[],
): Promise<Map<string, ImportedPhoto>> => {
  const unique = [...new Set(contentHashes)];

  const chunks = Array.from(
    { length: Math.ceil(unique.length / CHUNK) },
    (_, index) => unique.slice(index * CHUNK, (index + 1) * CHUNK),
  );

  const rows = await Promise.all(
    chunks.map(async (chunk) =>
      db
        .select({
          contentHash: dropboxImport.contentHash,
          imageId: dropboxImport.imageId,
          importedAt: dropboxImport.importedAt,
        })
        .from(dropboxImport)
        .where(inArray(dropboxImport.contentHash, chunk)),
    ),
  );

  return new Map(
    rows.flat().map(({ contentHash, ...imported }) => [contentHash, imported]),
  );
};

/** 取り込んだ写真を、content_hash ごとに記録する。 */
export const recordImportedPhoto = async (
  db: DatabaseExecutor,
  photo: NewImportedPhoto,
): Promise<void> => {
  await db
    .insert(dropboxImport)
    .values(photo)
    .onConflictDoUpdate({ target: dropboxImport.contentHash, set: photo });
};
