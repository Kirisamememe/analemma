import type { ApiQueryResult } from "@/api/server-state/server-state";

/** 1つの取得が、どこまで進んだか。 */
export type LoadStage = "Loading" | "Failed" | "Missing" | "Found";

/** 取得の結果(server が無いと答えたものを含む)を、進み具合にする。 */
export const loadStage = (
  query: ApiQueryResult<Readonly<Record<"_tag", string>>>,
): LoadStage => {
  if (query._tag !== "Loaded") return query._tag;

  return query.data._tag === "Succeeded" ? "Found" : "Missing";
};

/** 編集の画面に出すもの。 */
export type EditScreen =
  | "Editor"
  | "Loading"
  | "PageFailed"
  | "PageGone"
  | "KindFailed"
  | "KindGone";

/** 固定ページと種類の定義の取得の進み具合から、編集の画面に出すものを決める。 */
export const editScreen = (page: LoadStage, kind: LoadStage): EditScreen => {
  if (page === "Found" && kind === "Found") return "Editor";

  if (page === "Failed") return "PageFailed";

  if (page === "Missing") return "PageGone";

  if (page === "Loading" || kind === "Loading") return "Loading";

  return kind === "Failed" ? "KindFailed" : "KindGone";
};
