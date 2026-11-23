import { toDropboxPhoto } from "@/features/dropbox/importing/folder-photos";
import { readFolderPhotos } from "@/features/dropbox/importing/read-folder-photos";
import { adminProcedures } from "@/procedures";

/** App folder の写真を、取り込んだ記録と合わせて返す procedure。 */
export const listDropboxPhotos = adminProcedures.dropbox.photos.handler(
  async ({ context, errors, signal }) => {
    const read = await readFolderPhotos(context, signal);

    if (read._tag === "NotConnected") throw errors.NOT_CONNECTED();

    if (read._tag === "ConnectionLost") throw errors.CONNECTION_LOST();

    return {
      photos: read.photos.map((photo) =>
        toDropboxPhoto(photo, read.imported.get(photo.contentHash)),
      ),
    };
  },
);
