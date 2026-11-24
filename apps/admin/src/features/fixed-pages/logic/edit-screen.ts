import type {
  ApiQueryResult,
  QueryRetry,
} from "@/api/server-state/server-state";

/** server が「無い」と答えうる取得の結果。 */
type Found<Data> =
  | {
      /** どの結果か。 */
      readonly _tag: "Succeeded";
      /** 取得したデータ。 */
      readonly data: Data;
    }
  | Readonly<Record<"_tag", "Failed">>;

/** 種類の定義を待つ画面に出すもの。 */
export type DefinitionScreen<Kind> =
  | {
      /** どの表示か。 */
      readonly _tag: "Editor";
      /** 種類の定義。 */
      readonly kind: Kind;
      /** 取得済みの定義の更新をやり直す操作。 */
      readonly refreshFailure: QueryRetry | undefined;
    }
  | Readonly<Record<"_tag", "Loading">>
  | Readonly<Record<"_tag", "KindGone">>
  | (Readonly<Record<"_tag", "KindFailed">> & Record<"retry", QueryRetry>);

/** 種類の定義の取得から、作成の画面に出すものを決める。 */
export const definitionScreen = <Kind>(
  kind: ApiQueryResult<Found<Kind>>,
): DefinitionScreen<Kind> => {
  switch (kind._tag) {
    case "Loading":
      return { _tag: "Loading" };
    case "Failed":
      return { _tag: "KindFailed", retry: kind };
    case "Loaded":
      return kind.data._tag === "Succeeded"
        ? {
            _tag: "Editor",
            kind: kind.data.data,
            refreshFailure: kind.refreshFailure,
          }
        : { _tag: "KindGone" };
  }
};

/** 編集の画面に出すもの。 */
export type EditScreen<Page, Kind> =
  | (Exclude<DefinitionScreen<Kind>, Readonly<Record<"_tag", "Loading">>> &
      Record<"page", Page> &
      Record<"canDelete", boolean>)
  | Readonly<Record<"_tag", "Loading" | "PageGone">>
  | (Readonly<Record<"_tag", "PageFailed">> & Record<"retry", QueryRetry>);

/** 固定ページと種類の定義の取得から、編集の画面に出すものを決める。 */
export const editScreen = <Page, Kind>(
  page: ApiQueryResult<Found<Page>>,
  kind: ApiQueryResult<Found<Kind>>,
): EditScreen<Page, Kind> => {
  if (page._tag === "Loading") return { _tag: "Loading" };

  if (page._tag === "Failed") return { _tag: "PageFailed", retry: page };

  if (page.data._tag !== "Succeeded") return { _tag: "PageGone" };

  const definition = definitionScreen(kind);

  if (definition._tag === "Loading") return { _tag: "Loading" };

  return {
    ...definition,
    page: page.data.data,
    canDelete: definition._tag !== "KindFailed" || !definition.retry.isRetrying, // 取り直して編集のフォームに替わると、削除の Dialog ごと消える
  };
};
