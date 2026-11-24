import type { DropboxImport } from "@analemma/contract";

/** 取り込む写真1枚の状態。 */
export type ImportStatus = DropboxImport["photos"][number]["status"];

/** 取り込む写真1枚。 */
export type ImportPhoto = Readonly<DropboxImport["photos"][number]> & {
  /** 始めたときの一覧の content_hash(一覧に無ければ null)。 */
  readonly contentHash: string | null;
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
  /** 取り込みを始め、写真を1枚ずつ読む処理を流す。 */
  readonly begin: (run: ImportRun, process: () => Promise<void>) => void;
};

/** server のプロセスの中で、最後に始めた取り込みを持つ場所。 */
export type DropboxImports = {
  /** 最後に始めた取り込み。 */
  readonly current: () => ImportRun | undefined;
  /** 取り込みを始める準備をしているか、取り込んでいる途中か。 */
  readonly isBusy: () => boolean;
  /** 取り込みを始める権利を取る。 */
  readonly claim: () => ImportClaim | undefined;
  /** 手放すまで、取り込みを始めさせない。 */
  readonly pause: () => Disposable;
  /** 取り込みの状態を変える。 */
  readonly update: (change: (run: ImportRun) => ImportRun) => void;
  /** server を止めるので、次の写真へ進まないか。 */
  readonly stopping: () => boolean;
  /** 取り込みを始めさせず、取り込んでいる途中の1枚を終えるまで待つ。 */
  readonly stop: () => Promise<void>;
};

/** 最後に始めた取り込みを、プロセスのメモリに持つ場所を作る。 */
export const createDropboxImports = (): DropboxImports => {
  let run: ImportRun | undefined;
  let claimed = false;
  let paused = 0;
  let stopRequested = false;
  let running = Promise.resolve();

  const isBusy = (): boolean => claimed || run?.finishedAt === null;

  return {
    current: () => run,
    isBusy,
    claim: () => {
      if (isBusy() || paused > 0 || stopRequested) return undefined;

      claimed = true;

      return {
        begin: (next, process) => {
          run = next;
          claimed = false;
          running = process();
        },
        [Symbol.dispose]: () => {
          claimed = false;
        },
      };
    },
    pause: () => {
      paused += 1;

      return {
        [Symbol.dispose]: () => {
          paused -= 1;
        },
      };
    },
    update: (change) => {
      if (run !== undefined) run = change(run);
    },
    stopping: () => stopRequested,
    stop: async () => {
      stopRequested = true;
      await running;
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

/** 指した写真と、その後で待っている写真を、取り込めなかったことにする。 */
export const failRemaining =
  (from: number) =>
  (run: ImportRun): ImportRun => ({
    ...run,
    photos: run.photos.map((photo, at) =>
      at === from || (at > from && photo.status === "waiting")
        ? { ...photo, status: "failed", imageId: null }
        : photo,
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
