import type {
  ImportPhoto,
  ImportRun,
} from "@/features/dropbox/importing/import-run";

/** App folder にある写真のうち、取り込みを決めるのに使う値。 */
export type FolderPhoto = {
  /** Dropbox のファイルの ID。 */
  readonly id: string;
  /** App folder の中のパス。 */
  readonly path: string;
  /** ファイルの大きさ(bytes)。 */
  readonly size: number;
  /** Dropbox の content_hash。 */
  readonly contentHash: string;
};

/** 管理画面で選んだ写真。 */
export type SelectedPhoto = {
  /** Dropbox のファイルの ID。 */
  readonly id: string;
  /** 選んだときの content_hash。 */
  readonly contentHash: string;
};

/** 取り込みを決めるための材料。 */
export type ImportPlanInput = {
  /** 選んだ写真(選んだ順)。 */
  readonly selected: readonly SelectedPhoto[];
  /** App folder にある写真。 */
  readonly photos: readonly FolderPhoto[];
  /** 取り込み済みの写真の content_hash と、作った画像の ID。 */
  readonly imported: ReadonlyMap<string, string | null>;
  /** 1枚の大きさの上限(bytes)。 */
  readonly maxBytes: number;
  /** 始める日時。 */
  readonly now: Date;
};

/** 選んだ写真ごとに、取り込むか、取り込まずに終えるかを決める。 */
export const planImport = ({
  selected,
  photos,
  imported,
  maxBytes,
  now,
}: ImportPlanInput): ImportRun => {
  const byId = new Map(photos.map((photo) => [photo.id, photo]));

  const planPhoto = ({
    id,
    contentHash: chosen,
  }: SelectedPhoto): ImportPhoto => {
    const photo = byId.get(id);

    if (photo === undefined) {
      return {
        id,
        path: "",
        status: "not-found",
        imageId: null,
        contentHash: null,
      };
    }

    const { path, contentHash } = photo;

    if (contentHash !== chosen) {
      return { id, path, status: "changed", imageId: null, contentHash };
    }

    const importedImageId = imported.get(photo.contentHash);

    if (importedImageId !== undefined) {
      return {
        id,
        path,
        status: "already-added",
        imageId: importedImageId,
        contentHash,
      };
    }

    return {
      id,
      path,
      status: photo.size > maxBytes ? "too-large" : "waiting",
      imageId: null,
      contentHash,
    };
  };

  return {
    startedAt: now,
    finishedAt: null,
    photos: [
      ...new Map(selected.map((choice) => [choice.id, choice])).values(),
    ].map((choice) => planPhoto(choice)),
  };
};
