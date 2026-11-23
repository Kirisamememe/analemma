/** 写真のファイルの読み込みの状態。 */
export type PhotoLoad = {
  /** 読み込みの状態。 */
  readonly status: "loading" | "loaded" | "failed" | "retrying";
  /** 読み込み直した回数(img を作り直すキー)。 */
  readonly attempt: number;
};

/** 写真を表示し始めたときの状態。 */
export const PHOTO_LOADING: PhotoLoad = { status: "loading", attempt: 0 };

/** 写真のファイルで起きたこと。 */
export type PhotoEvent = "load" | "error" | "retry";

/** 写真のファイルで起きたことに合わせて、読み込みの状態を進める。 */
export const nextPhotoLoad = (
  load: PhotoLoad,
  event: PhotoEvent,
): PhotoLoad => {
  switch (event) {
    case "load":
      return { ...load, status: "loaded" };
    case "error":
      return { ...load, status: "failed" };
    case "retry":
      return { status: "retrying", attempt: load.attempt + 1 };
  }
};
