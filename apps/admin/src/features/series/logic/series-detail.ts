import type { changeSeries, SeriesChange } from "../queries/series-query";

const DONE = {
  publish: "fixedPages.publishDone",
  unpublish: "fixedPages.unpublishDone",
  delete: "fixedPages.deleted",
} as const;

/** シリーズの変更の応答に合わせた画面の操作。 */
export const seriesChangeResult = (
  change: SeriesChange,
  code: Awaited<ReturnType<typeof changeSeries>>,
) =>
  code === undefined
    ? ({
        kind: "changed",
        message: DONE[change.action],
        deleted: change.action === "delete",
      } as const)
    : ({ kind: "failed", message: "series.imageGone" } as const);

type DetailState = {
  /** 開いている Dialog。 */
  dialog?: "edit" | "delete" | undefined;
  /** 応答を待っている操作。 */
  pending?: SeriesChange | undefined;
};
type Event =
  | (Record<"type", "dialog"> & Pick<DetailState, "dialog">)
  | {
      /** 操作の段階。 */
      type: "sent" | "changed" | "failed";
      /** 送った操作。 */
      change: SeriesChange;
    };

/** シリーズ詳細の Dialog と送信の状態遷移。 */
export const seriesDetailReducer = (
  state: DetailState,
  event: Event,
): DetailState => {
  switch (event.type) {
    case "dialog":
      return { ...state, dialog: event.dialog };
    case "sent":
      return { ...state, pending: event.change };
    case "failed":
      return state.pending === event.change
        ? { ...state, pending: undefined }
        : state;
    case "changed":
      return state.pending === event.change ? {} : state;
  }
};
