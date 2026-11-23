import type { MessageKey } from "@/i18n/use-translate";

/** 前後の画像の ID。 */
export type NeighborIds = {
  /** 前(一つ新しい)の画像の ID。 */
  readonly previous: string | undefined;
  /** 次(一つ古い)の画像の ID。 */
  readonly next: string | undefined;
};

/** 写真を見る画面の、取得の進み具合。 */
type ViewerInput = {
  /** URL の画像の ID。 */
  readonly id: string;
  /** 情報と一緒に表示している写真の ID(表示していなければ undefined)。 */
  readonly shownId: string | undefined;
  /** URL の画像の取得の状態。 */
  readonly status: "Loading" | "Failed" | "Loaded";
  /** 前後の画像の取得が終わったか。 */
  readonly hasNeighbors: boolean;
};

/** 前後へ移れるか、描き終えたか、何を待っているか。 */
export type ViewerProgress = {
  /** 前後の写真へ移れるか。 */
  readonly canMove: boolean;
  /** 待つものが無くなり、focus を戻せるか。 */
  readonly ready: boolean;
  /** 写真や情報を待つ間の案内(待っていなければ undefined)。 */
  readonly waiting: MessageKey | undefined;
};

const waitingFor = ({
  id,
  shownId,
  status,
  hasNeighbors,
}: ViewerInput): MessageKey | undefined => {
  if (status === "Failed") return undefined;

  if (shownId !== id) return "imageViewer.loading";

  if (status === "Loading") return "imageDetail.loadingInfo";

  return hasNeighbors ? undefined : "imageDetail.loadingNeighbors";
};

/** URL の画像・表示中の写真・取得の状態から、画面の進み具合を決める。 */
export const viewerProgress = (input: ViewerInput): ViewerProgress => {
  const { id, shownId, status, hasNeighbors } = input;
  const canMove = shownId === id && status === "Loaded" && hasNeighbors;

  return {
    canMove,
    ready:
      status !== "Loading" &&
      (shownId === undefined || canMove || status === "Failed"),
    waiting: waitingFor(input),
  };
};

/** 前後の矢印に使う前後の画像を、移れる前後に替えるか、最後に移れた前後のまま残す。 */
export const keepNeighborLinks = (
  last: NeighborIds | undefined,
  movable: NeighborIds | undefined,
): NeighborIds | undefined => {
  if (movable === undefined) return last;

  const current = movable;

  return last !== undefined &&
    current.previous === last.previous &&
    current.next === last.next
    ? last
    : { previous: current.previous, next: current.next };
};
