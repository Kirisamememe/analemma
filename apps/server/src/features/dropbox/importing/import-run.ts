import type { DropboxImport } from "@analemma/contract";

/** 取り込む写真1枚の状態。 */
export type ImportStatus = DropboxImport["photos"][number]["status"];

/** 取り込む写真1枚。 */
export type ImportPhoto = {
  /** Dropbox のファイルの ID。 */
  readonly id: string;
  /** App folder の中のパス(無ければ空の文字列)。 */
  readonly path: string;
  /** 写真の状態。 */
  readonly status: ImportStatus;
  /** 作った画像か、同じ中身で取り込み済みの画像の ID。 */
  readonly imageId: string | null;
};

/** 1回の取り込み。 */
export type ImportRun = {
  /** 始めた日時。 */
  readonly startedAt: Date;
  /** すべての写真を終えた日時。 */
  readonly finishedAt: Date | null;
  /** 選んだ順の写真。 */
  readonly photos: readonly ImportPhoto[];
};

/** 取り込みを始める権利。 */
export type ImportClaim = Disposable & {
  /** 取り込みを始める。 */
  readonly begin: (run: ImportRun) => void;
};

/** server のプロセスの中で、最後に始めた取り込みを持つ場所。 */
export type DropboxImports = {
  /** 最後に始めた取り込み。 */
  readonly current: () => ImportRun | undefined;
  /** 取り込みを始める準備をしているか、取り込んでいる途中か。 */
  readonly isBusy: () => boolean;
  /** 取り込みを始める権利を取る。 */
  readonly claim: () => ImportClaim | undefined;
  /** 取り込みの状態を変える。 */
  readonly update: (change: (run: ImportRun) => ImportRun) => void;
};

/** 最後に始めた取り込みを、プロセスのメモリに持つ場所を作る。 */
export const createDropboxImports = (): DropboxImports => {
  let run: ImportRun | undefined;
  let claimed = false;

  const isBusy = (): boolean => claimed || run?.finishedAt === null;

  return {
    current: () => run,
    isBusy,
    claim: () => {
      if (isBusy()) return undefined;

      claimed = true;

      return {
        begin: (next) => {
          run = next;
          claimed = false;
        },
        [Symbol.dispose]: () => {
          claimed = false;
        },
      };
    },
    update: (change) => {
      if (run !== undefined) run = change(run);
    },
  };
};

/** 写真1枚の、変える状態と画像の ID。 */
export type PhotoChange = Pick<ImportPhoto, "status" | "imageId">;

/** 写真1枚の状態を変える。 */
export const withPhotoStatus =
  (index: number, change: PhotoChange) =>
  (run: ImportRun): ImportRun => ({
    ...run,
    photos: run.photos.map((photo, at) =>
      at === index ? { ...photo, ...change } : photo,
    ),
  });

/** 取り込みを終えたことにする。 */
export const finishRun =
  (now: Date) =>
  (run: ImportRun): ImportRun => ({ ...run, finishedAt: now });

/** 取り込みを、contract の出力の形にする。 */
export const toDropboxImport = (run: ImportRun): DropboxImport => ({
  startedAt: run.startedAt.toISOString(),
  finishedAt: run.finishedAt?.toISOString() ?? null,
  photos: run.photos.map(({ id, path, status, imageId }) => ({
    id,
    path,
    status,
    imageId,
  })),
});
