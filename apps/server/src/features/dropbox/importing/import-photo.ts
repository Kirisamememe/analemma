import { PHOTO_MAX_BYTES } from "@analemma/contract";

import type { AppContext } from "@/context";
import type { DropboxSession } from "@/features/dropbox/connection/open-dropbox-session";
import type {
  ImportPhoto,
  ImportStatus,
  PhotoChange,
} from "@/features/dropbox/importing/import-run";
import { recordImportedPhoto } from "@/features/dropbox/importing/queries/dropbox-imports.query";
import { createImage } from "@/features/images/creating/create-image";

/** 写真1枚を取り込んだ結果。 */
export type ImportOutcome =
  | {
      /** どの結果か。 */
      readonly _tag: "Finished";
      /** 写真の、変える状態と画像の ID。 */
      readonly change: PhotoChange;
    }
  | {
      /** Dropbox との接続が切れた。 */
      readonly _tag: "ConnectionLost";
    };

/** 取り込みに使う依存。 */
export type ImportContext = Pick<
  AppContext,
  "clock" | "conversions" | "db" | "dropbox" | "logger" | "storage"
> & {
  /** つないだアカウントの session。 */
  readonly session: DropboxSession;
  /** この取り込みで画像を作った写真の content_hash と、画像の ID。 */
  readonly added: ReadonlyMap<string, string>;
};

const finished = (
  status: ImportStatus,
  imageId: string | null = null,
): ImportOutcome => ({ _tag: "Finished", change: { status, imageId } });

/** Dropbox から写真1枚を読み、選んだときと同じ中身なら画像を作って記録する。 */
export const importPhoto = async (
  context: ImportContext,
  photo: ImportPhoto,
): Promise<ImportOutcome> => {
  const { session, added } = context;
  const accessToken = await session.accessToken();

  if (accessToken === undefined) return { _tag: "ConnectionLost" };

  const downloaded = await session.api.download(accessToken, {
    fileId: photo.id,
    maxBytes: PHOTO_MAX_BYTES,
    accept: ({ contentHash }) =>
      contentHash === photo.contentHash && !added.has(contentHash),
  });

  switch (downloaded._tag) {
    case "Unauthorized": {
      await session.confirmLost();

      return { _tag: "ConnectionLost" };
    }
    case "NotFound": {
      return finished("not-found");
    }
    case "TooLarge": {
      return finished("too-large");
    }
    case "Declined": {
      const { contentHash } = downloaded.file;

      return contentHash === photo.contentHash
        ? finished("already-added", added.get(contentHash) ?? null)
        : finished("changed");
    }
    case "Downloaded": {
      break;
    }
  }

  const { file, bytes } = downloaded;
  const created = await createImage(context, bytes);

  if (created._tag === "UnsupportedFormat") return finished("unsupported");

  await recordImportedPhoto(context.db, {
    contentHash: file.contentHash,
    fileId: file.id,
    path: file.path,
    imageId: created.image.id,
    importedAt: context.clock.now(),
  });

  context.logger.write({
    level: "info",
    message: "Dropbox の写真から画像を作った",
    details: { imageId: created.image.id, fileId: file.id },
  });

  return finished("added", created.image.id);
};
