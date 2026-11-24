import { DROPBOX_IMPORT_MAX_PHOTOS } from "@analemma/contract";

import type {
  DropboxImport,
  DropboxPhoto,
  DropboxSelection,
} from "@/features/dropbox/queries/dropbox-queries";

/** 取り込みの中の写真1枚。 */
export type RunPhoto = DropboxImport["photos"][number];

/** 一覧に出す写真の状態。 */
export type PhotoRowStatus =
  | "new"
  | "imported"
  | "image-deleted"
  | RunPhoto["status"];

/** 一覧に出す写真1枚。 */
export type PhotoRow = {
  /** Dropbox のファイルの ID。 */
  readonly id: string;
  /** App folder の中のパス。 */
  readonly path: string;
  /** 大きさ(bytes)。 */
  readonly size: number;
  /** Dropbox でファイルが最後に変わった日時。 */
  readonly modifiedAt: string;
  /** 写真の状態。 */
  readonly status: PhotoRowStatus;
  /** 作った画像か、取り込み済みの画像の ID。 */
  readonly imageId: string | null;
};

/** 取り込みの進み具合の数。 */
export type RunCounts = {
  /** 取り込みに選んだ写真の数。 */
  readonly total: number;
  /** 終えた写真の数。 */
  readonly done: number;
  /** 画像を足した写真の数。 */
  readonly added: number;
  /** 取り込めなかった写真の数。 */
  readonly failed: number;
};

const PENDING = new Set<PhotoRowStatus>(["waiting", "importing"]);

const FAILED = new Set<PhotoRowStatus>([
  "not-found",
  "changed",
  "too-large",
  "unsupported",
  "failed",
]);

const NOT_IMPORTABLE = new Set<PhotoRowStatus>([
  "imported",
  "image-deleted",
  "added",
  "already-added",
  "waiting",
  "importing",
  "too-large",
  "unsupported",
]);

/** 取り込みの写真を、ID で引ける形にする。 */
export const indexRun = (
  run: DropboxImport | null | undefined,
): ReadonlyMap<string, RunPhoto> =>
  new Map(run?.photos.map((photo) => [photo.id, photo]));

/** App folder の写真と、取り込みの中のその写真から、一覧に出す1枚を作る。 */
export const toPhotoRow = (
  photo: DropboxPhoto,
  running: RunPhoto | undefined,
): PhotoRow => {
  const { id, path, size, modifiedAt, imported } = photo;

  if (running !== undefined) {
    return {
      id,
      path,
      size,
      modifiedAt,
      status: running.status,
      imageId: running.imageId ?? imported?.imageId ?? null,
    };
  }

  if (imported === null) {
    return { id, path, size, modifiedAt, status: "new", imageId: null };
  }

  return {
    id,
    path,
    size,
    modifiedAt,
    status: imported.imageId === null ? "image-deleted" : "imported",
    imageId: imported.imageId,
  };
};

/** まだ取り込んでいない、取り込める写真を、一覧の順に返す。 */
export const listImportable = (
  photos: readonly DropboxPhoto[],
  run: DropboxImport | null | undefined,
): DropboxSelection[] => {
  const running = indexRun(run);

  return photos
    .filter(
      (photo) =>
        !NOT_IMPORTABLE.has(toPhotoRow(photo, running.get(photo.id)).status),
    )
    .map(({ id, contentHash }) => ({ id, contentHash }));
};

/** 1回の取り込みで送る写真(一覧の順に、上限の枚数まで)。 */
export const takeImportBatch = (
  importable: readonly DropboxSelection[],
): readonly DropboxSelection[] =>
  importable.slice(0, DROPBOX_IMPORT_MAX_PHOTOS);

/** 取り込みの途中か。 */
export const isImporting = (run: DropboxImport | null | undefined): boolean =>
  run?.finishedAt === null;

/** 取り込みの進み具合を数える。 */
export const countRun = (run: DropboxImport): RunCounts => ({
  total: run.photos.length,
  done: run.photos.filter(({ status }) => !PENDING.has(status)).length,
  added: run.photos.filter(({ status }) => status === "added").length,
  failed: run.photos.filter(({ status }) => FAILED.has(status)).length,
});
