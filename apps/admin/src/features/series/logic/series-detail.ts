import type { changeSeries, SeriesChange } from "../queries/change-series";

const DONE = {
  addImages: "series.added",
  removeImages: "series.removed",
  reorder: "fixedPages.reordered",
  publish: "fixedPages.publishDone",
  unpublish: "fixedPages.unpublishDone",
  delete: "fixedPages.deleted",
} as const;

/** シリーズの変更の応答に合わせた画面の操作。 */
export const seriesChangeResult = (
  change: SeriesChange,
  code: Awaited<ReturnType<typeof changeSeries>>,
) => {
  if (code === "NOT_FOUND" && change.action === "addImages") {
    return { kind: "checkImages", imageIds: change.imageIds } as const;
  }

  if (code !== undefined) {
    return {
      kind: "failed",
      message:
        code === "ORDER_MISMATCH" ? "series.orderMismatch" : "series.imageGone",
    } as const;
  }

  if ("imageIds" in change) {
    return {
      kind: "changed",
      message: DONE[change.action],
      withTitle: false,
      deleted: false,
      focusAdd: change.action !== "reorder",
    } as const;
  }

  return {
    kind: "changed",
    message: DONE[change.action],
    withTitle: true,
    deleted: change.action === "delete",
    focusAdd: false,
  } as const;
};

type Dialog = "picker" | "edit" | "delete";
type DetailState = {
  /** 開いている Dialog。 */
  dialog?: Dialog | undefined;
  /** 応答を待っている操作。 */
  pending?: SeriesChange | undefined;
  /** 削除された画像の ID。 */
  missing?: ReadonlySet<string> | undefined;
  /** 画像を追加するボタンへ focus を戻すか。 */
  focusAdd?: boolean;
};
type ChangeEvent<Kind extends string> = {
  /** 操作の段階。 */
  type: Kind;
  /** 送った操作。 */
  change: SeriesChange;
};
type Event =
  | (Record<"type", "dialog"> & Pick<DetailState, "dialog">)
  | ChangeEvent<"sent">
  | (ChangeEvent<"failed"> & Pick<DetailState, "missing">)
  | (ChangeEvent<"changed"> & Required<Pick<DetailState, "focusAdd">>)
  | Record<"type", "focused">;

/** シリーズ詳細の Dialog、送信、focus の状態遷移。 */
export const seriesDetailReducer = (
  state: DetailState,
  event: Event,
): DetailState => {
  switch (event.type) {
    case "dialog":
      return { ...state, dialog: event.dialog };
    case "focused":
      return { ...state, focusAdd: false };
    case "sent":
      return { ...state, pending: event.change };
    case "failed":
      return state.pending === event.change
        ? {
            ...state,
            pending: undefined,
            missing: event.missing ?? state.missing,
          }
        : state;
    case "changed":
      return state.pending === event.change
        ? { missing: state.missing, focusAdd: event.focusAdd }
        : state;
  }
};

/** 応答を待つ間、画面に表示する並び。 */
export const seriesPendingOrder = (pending: SeriesChange | undefined) =>
  pending?.action === "reorder" ? pending.imageIds : undefined;
