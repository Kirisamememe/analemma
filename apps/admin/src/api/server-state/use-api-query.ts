import { skipToken, useQuery, useQueryClient } from "@tanstack/react-query";

import { isUnauthorized } from "@/api/api-errors";

type QueryOptions<Data, Selected> = {
  /** 更新に失敗したときも、取得済みの内容を表示するか。 */
  readonly keepDataOnRefreshError?: boolean;
  /** query のキー。 */
  readonly key: readonly unknown[];
  /** データを取得する関数。 */
  readonly load: (() => Promise<Data>) | undefined;
  /** この画面で使う部分を取り出す関数。 */
  readonly select?: (data: Data) => Selected;
  /** タブ内で取得結果を使い回す期間(ミリ秒)。 */
  readonly tabStaleTime?: number | ((data: Data | undefined) => number);
};

/** 失敗した取得をやり直す操作と状態。 */
export type QueryRetry = {
  /** 取得をやり直す関数。 */
  readonly retry: () => void;
  /** 取得をやり直しているか。 */
  readonly isRetrying: boolean;
};

/** server のデータを読んだ結果。 */
export type ApiQueryResult<Data> =
  | {
      /** どの結果か。 */
      readonly _tag: "Loading";
    }
  | (Record<"_tag", "Failed"> & QueryRetry)
  | {
      /** どの結果か。 */
      readonly _tag: "Loaded";
      /** 取得したデータ。 */
      readonly data: Data;
      /** 前のデータを表示したまま、失敗した更新をやり直す操作。 */
      readonly refreshFailure?: QueryRetry;
    };

/** server のデータを読み、取得の状態を返す。 */
export const useApiQuery = <Data, Selected = Data>({
  key,
  load,
  select,
  keepDataOnRefreshError,
  tabStaleTime,
}: QueryOptions<Data, Selected>): ApiQueryResult<Selected> => {
  const cache = useQueryClient();

  const query = useQuery<Data, Error, Selected>({
    ...(select === undefined ? {} : { select }),
    queryKey: key,
    queryFn: load ?? skipToken,
    ...(load === undefined || tabStaleTime === undefined
      ? {}
      : {
          staleTime:
            typeof tabStaleTime === "number"
              ? tabStaleTime
              : (stored) => tabStaleTime(stored.state.data),
          gcTime: Infinity,
        }),
  });

  const keepInTab =
    typeof tabStaleTime === "function"
      ? tabStaleTime(cache.getQueryData<Data>(key)) > 0
      : tabStaleTime !== undefined;

  if (
    (query.isPending && query.errorUpdateCount === 0) ||
    (typeof tabStaleTime === "function" &&
      query.isFetching &&
      query.isSuccess &&
      !keepInTab)
  ) {
    return { _tag: "Loading" };
  }

  if (query.isPending || query.isError) {
    const retry: QueryRetry = {
      isRetrying: query.fetchStatus !== "idle",
      retry: () => {
        void query.refetch();
      },
    };

    if (query.isRefetchError && !isUnauthorized(query.error)) {
      if (keepInTab) {
        return { _tag: "Loaded", data: query.data, refreshFailure: retry };
      }

      if (keepDataOnRefreshError === true) {
        return { _tag: "Loaded", data: query.data };
      }
    }

    return { _tag: "Failed", ...retry };
  }

  return { _tag: "Loaded", data: query.data };
};
