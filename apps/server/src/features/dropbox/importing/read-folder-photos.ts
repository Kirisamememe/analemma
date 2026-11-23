import type { AppContext } from "@/context";
import {
  type DropboxSession,
  openDropboxSession,
} from "@/features/dropbox/connection/open-dropbox-session";
import { selectFolderPhotos } from "@/features/dropbox/importing/folder-photos";
import {
  findImportedPhotos,
  type ImportedPhoto,
} from "@/features/dropbox/importing/queries/dropbox-imports.query";
import type { DropboxFile } from "@/platform/dropbox/dropbox-api";

/** App folder の写真を読んだ結果。 */
export type FolderPhotosRead =
  | {
      /** どの結果か。 */
      readonly _tag: "Read";
      /** 読むのに使った session。 */
      readonly session: DropboxSession;
      /** 取り込める形式の写真(新しく変わった順)。 */
      readonly photos: readonly DropboxFile[];
      /** content_hash ごとの、取り込んだ記録。 */
      readonly imported: ReadonlyMap<string, ImportedPhoto>;
    }
  | {
      /** つないでいない(app key と app secret が無いときも)。 */
      readonly _tag: "NotConnected";
    }
  | {
      /** Dropbox との接続が切れた。 */
      readonly _tag: "ConnectionLost";
    };

/** つないだアカウントの App folder の写真と、取り込んだ記録を読む。 */
export const readFolderPhotos = async (
  context: Pick<AppContext, "clock" | "db" | "dropbox">,
  signal: AbortSignal | undefined,
): Promise<FolderPhotosRead> => {
  const opened = await openDropboxSession(context, signal);

  switch (opened._tag) {
    case "NotConfigured":
    case "NotConnected": {
      return { _tag: "NotConnected" };
    }
    case "ConnectionLost": {
      return opened;
    }
    case "Opened": {
      break;
    }
  }

  const { session } = opened;
  const token = await session.accessToken();

  if (token === undefined) return { _tag: "ConnectionLost" };

  const listed = await session.api.listFiles(token, signal);

  if (listed._tag === "Unauthorized") return { _tag: "ConnectionLost" };

  const photos = selectFolderPhotos(listed.files);

  const imported = await findImportedPhotos(
    context.db,
    photos.map(({ contentHash }) => contentHash),
  );

  return { _tag: "Read", session, photos, imported };
};
