import type { AdminImage, LoadedImage } from "../queries/image-query";

import type { ApiQueryResult } from "@/api/server-state/server-state";

/** URL の画像と、情報と一緒に表示している写真の記録。 */
export type ImageVisit = {
  /** 現在の URL の画像の ID。 */
  readonly id: string;
  /** 写真が切り替わるときの向き。 */
  readonly direction?: "previous" | "next";
  /** 情報と一緒に表示している写真。 */
  readonly shown?: AdminImage;
  /** 最後に取得した、URL の画像。 */
  readonly latest?: AdminImage | undefined;
};

/** 画像の取得の結果から、取得できた画像を取り出す。 */
export const loadedImage = (
  query: ApiQueryResult<LoadedImage>,
): AdminImage | undefined =>
  query._tag === "Loaded" && query.data._tag === "Succeeded"
    ? query.data.data
    : undefined;

/** 開いた URL と、取得した画像。 */
export type VisitTarget = {
  /** URL の画像の ID。 */
  readonly id: string;
  /** 取得できた画像(まだ届いていなければ undefined)。 */
  readonly latest: AdminImage | undefined;
};

/** 開いた URL と取得した画像に合わせて、記録を進める。 */
export const followVisit = (
  visit: ImageVisit,
  { id, latest }: VisitTarget,
): ImageVisit => {
  const moved: ImageVisit =
    visit.id === id
      ? visit
      : { ...visit, id, direction: id < visit.id ? "next" : "previous" };

  const showNow =
    latest !== undefined &&
    latest !== moved.shown &&
    (moved.shown === undefined ||
      moved.shown.id === id ||
      latest.deliveryImages.length === 0); // 読み込む写真が無ければ、待たずに替える

  if (showNow) return { ...moved, shown: latest, latest };

  return moved.latest === latest ? moved : { ...moved, latest };
};

/** 読み込みを待っていた写真を、情報と一緒に表示する写真にする。 */
export const settleVisit = (visit: ImageVisit, photoId: string): ImageVisit =>
  visit.id === photoId && visit.latest?.id === photoId
    ? { ...visit, shown: visit.latest }
    : visit;

/** 表示する写真と、読み込みを待っている写真。 */
export type VisitPhotos = {
  /** 情報と一緒に表示する写真。 */
  readonly shown: AdminImage | undefined;
  /** 読み込みを待っている次の写真。 */
  readonly pending: AdminImage | undefined;
};

/** URL の画像の取得の状態と、取得できた画像。 */
export type ImageLoad = {
  /** 取得の状態。 */
  readonly status: ApiQueryResult<LoadedImage>["_tag"];
  /** 取得できた画像(無い・まだ届いていなければ undefined)。 */
  readonly latest: AdminImage | undefined;
};

/** 記録と取得の状態から、表示する写真と待っている写真を決める。 */
export const visitPhotos = (
  visit: ImageVisit,
  { status, latest }: ImageLoad,
): VisitPhotos => {
  const keepShown =
    status === "Loading" ||
    latest !== undefined ||
    (status === "Failed" && visit.shown?.id === visit.id);

  const shown = keepShown ? visit.shown : undefined;

  return {
    shown,
    pending:
      latest !== undefined && latest.id !== shown?.id ? latest : undefined,
  };
};
