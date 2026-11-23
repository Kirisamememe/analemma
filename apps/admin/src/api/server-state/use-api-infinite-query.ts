import { type InfiniteData, useInfiniteQuery } from "@tanstack/react-query";
import { useState } from "react";

type InfiniteQueryOptions<Page> = {
  /** query のキー。 */
  readonly key: readonly unknown[];
  /** cursor の後ろの1ページを取得する関数(最初のページでは cursor が無い)。 */
  readonly load: (cursor: string | undefined) => Promise<Page>;
  /** 次のページの cursor を返す関数(次が無ければ undefined)。 */
  readonly next: (page: Page) => string | undefined;
};

/** 続きのページの状態。 */
export type NextPage =
  | {
      /** どの状態か。 */
      readonly _tag: "None";
    }
  | {
      /** どの状態か。 */
      readonly _tag: "Available";
      /** 一覧か続きを取得しているか。 */
      readonly isLoading: boolean;
      /** 続きを取得する関数。 */
      readonly load: () => void;
    }
  | {
      /** どの状態か。 */
      readonly _tag: "Failed";
      /** 続きを取り直しているか。 */
      readonly isRetrying: boolean;
      /** 続きを取り直す関数。 */
      readonly retry: () => void;
    };

type InfiniteQueryResult<Page> =
  | {
      /** どの結果か。 */
      readonly _tag: "Loading";
    }
  | {
      /** どの結果か。 */
      readonly _tag: "Failed";
      /** 取り直しているか。 */
      readonly isRetrying: boolean;
      /** 取り直す関数。 */
      readonly retry: () => void;
    }
  | {
      /** どの結果か。 */
      readonly _tag: "Loaded";
      /** 取得したページの並び。 */
      readonly pages: readonly Page[];
      /** 続きのページの状態。 */
      readonly next: NextPage;
    };

/** cursor で続きを読む server のデータを読み、取得の状態を返す。 */
export const useApiInfiniteQuery = <Page>({
  key,
  load,
  next,
}: InfiniteQueryOptions<Page>): InfiniteQueryResult<Page> => {
  const query = useInfiniteQuery<
    Page,
    Error,
    InfiniteData<Page, string | undefined>,
    readonly unknown[],
    string | undefined
  >({
    queryKey: key,
    queryFn: ({ pageParam }) => load(pageParam),
    initialPageParam: undefined,
    getNextPageParam: (page) => next(page),
  });

  const [nextFailure, setNextFailure] =
    useState<Pick<typeof query, "error" | "errorUpdateCount">>();

  if (query.isPending && query.errorUpdateCount === 0) {
    return { _tag: "Loading" };
  }

  const failedNext =
    query.isFetchNextPageError ||
    (query.isError &&
      nextFailure?.error === query.error &&
      nextFailure.errorUpdateCount === query.errorUpdateCount);

  if (query.data === undefined || (query.isError && !failedNext)) {
    return {
      _tag: "Failed",
      isRetrying: query.fetchStatus !== "idle", // 次の試行を待って一時停止している間も、取り直している
      retry: () => {
        void query.refetch();
      },
    };
  }

  const loadNext = async (): Promise<void> => {
    const result = await query.fetchNextPage({ cancelRefetch: false });

    if (result.isFetchNextPageError) {
      setNextFailure({
        error: result.error,
        errorUpdateCount: result.errorUpdateCount,
      });
    }
  };

  const fetchNext = (): void => {
    void loadNext();
  };

  const nextPage = (): NextPage => {
    if (!query.hasNextPage) return { _tag: "None" };

    return failedNext
      ? {
          _tag: "Failed",
          isRetrying: query.fetchStatus !== "idle",
          retry: fetchNext,
        }
      : {
          _tag: "Available",
          isLoading: query.fetchStatus !== "idle",
          load: fetchNext,
        };
  };

  return { _tag: "Loaded", pages: query.data.pages, next: nextPage() };
};
