import type { ApiOutputs } from "@/api/api-types";
import type { ApiQueryResult } from "@/api/server-state/server-state";

type QueryStage = ApiQueryResult<unknown>["_tag"];

/** 固定ページの一覧の欄に出すもの。 */
export type FixedPagesView = "Loading" | "Failed" | "Empty" | "Rows";

/** 一覧の欄を決める、取得の進み具合と行の数。 */
type ListInput = {
  /** 固定ページの一覧の取得の状態。 */
  readonly pages: QueryStage;
  /** 種類の一覧の取得の状態。 */
  readonly kinds: QueryStage;
  /** 読めなかった種類の一覧を取り直しているか。 */
  readonly kindsRetrying: boolean;
  /** 並べる行の数。 */
  readonly rows: number;
};

/** 固定ページと種類の一覧の取得から、一覧の欄に出すものを決める。 */
export const fixedPagesView = ({
  pages,
  kinds,
  kindsRetrying,
  rows,
}: ListInput): FixedPagesView => {
  if (pages === "Loading" || kinds === "Loading") return "Loading";

  if (pages === "Failed") return "Failed";

  if (kindsRetrying) return "Loading";

  return rows === 0 ? "Empty" : "Rows";
};

/** 種類の名前から、表示するラベルを引く表。 */
export const kindLabels = (
  kinds: ApiOutputs["admin"]["kinds"]["list"]["kinds"] | undefined,
): ReadonlyMap<string, string> =>
  new Map(kinds?.map(({ name, label }) => [name, label]));
