import type { ApiOutputs } from "@/api/api-types";
import type {
  ApiQueryResult,
  QueryRetry,
} from "@/api/server-state/server-state";

/** 固定ページの一覧の欄に出すもの。 */
export type FixedPagesView<Row> =
  | Readonly<Record<"_tag", "Loading" | "Empty">>
  | (Readonly<Record<"_tag", "Failed">> & QueryRetry)
  | {
      /** どの表示か。 */
      readonly _tag: "Rows";
      /** 並べる行。 */
      readonly rows: readonly Row[];
    };

/** 一覧の欄を決める、取得と行。 */
type ListInput<Row> = {
  /** 固定ページの一覧の取得。 */
  readonly pages: ApiQueryResult<unknown>;
  /** 種類の一覧の取得。 */
  readonly kinds: ApiQueryResult<unknown>;
  /** 並べる行。 */
  readonly rows: readonly Row[];
};

/** 固定ページと種類の一覧の取得から、一覧の欄に出すものを決める。 */
export const fixedPagesView = <Row>({
  pages,
  kinds,
  rows,
}: ListInput<Row>): FixedPagesView<Row> => {
  const kindsRetrying = kinds._tag === "Failed" && kinds.isRetrying;

  if (pages._tag === "Loading" || kinds._tag === "Loading") {
    return { _tag: "Loading" };
  }

  if (pages._tag === "Failed") {
    return {
      _tag: "Failed",
      isRetrying: pages.isRetrying || kindsRetrying,
      retry: () => {
        pages.retry();

        if (kinds._tag === "Failed") kinds.retry(); // 種類のラベルも読めていなければ、一緒に取り直す
      },
    };
  }

  if (kindsRetrying) return { _tag: "Loading" };

  return rows.length === 0 ? { _tag: "Empty" } : { _tag: "Rows", rows };
};

/** 種類の名前から、表示するラベルを引く表。 */
export const kindLabels = (
  kinds: ApiOutputs["admin"]["kinds"]["list"]["kinds"] | undefined,
): ReadonlyMap<string, string> =>
  new Map(kinds?.map(({ name, label }) => [name, label]));
