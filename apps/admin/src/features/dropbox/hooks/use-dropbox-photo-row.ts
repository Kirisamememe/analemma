import { useAppContext } from "@/api/app-context";
import { useApiData } from "@/api/server-state/use-api-data";
import { type PhotoRow, toPhotoRow } from "@/features/dropbox/logic/photo-rows";
import {
  DROPBOX_IMPORT_KEY,
  DROPBOX_PHOTOS_KEY,
  type DropboxImport,
  type DropboxPhotos,
  loadDropboxImport,
  loadDropboxPhotos,
} from "@/features/dropbox/queries/dropbox-queries";

/** 写真1枚の、一覧に出す行を読む(その写真が変わったときだけ描き直す)。 */
export const useDropboxPhotoRow = (id: string): PhotoRow | undefined => {
  const { api } = useAppContext();

  const photo = useApiData({
    key: DROPBOX_PHOTOS_KEY,
    load: async () => loadDropboxPhotos(api),
    select: (photos: DropboxPhotos) =>
      photos._tag === "Listed"
        ? photos.photos.find((candidate) => candidate.id === id)
        : undefined,
  });

  const running = useApiData({
    key: DROPBOX_IMPORT_KEY,
    load: async () => loadDropboxImport(api),
    select: (run: DropboxImport | null) =>
      run?.photos.find((candidate) => candidate.id === id),
  });

  return photo === undefined ? undefined : toPhotoRow(photo, running);
};
