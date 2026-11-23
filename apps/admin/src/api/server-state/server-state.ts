import {
  skipToken,
  type InfiniteData,
  type Query,
  useIsFetching,
  useIsMutating,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { isUnauthorized } from "@/api/api-errors";

type QueryOptions<Data> = {
  /** 更新に失敗したときも、取得済みの内容を表示するか。 */
  readonly keepDataOnRefreshError?: boolean;
  /** query のキー。 */
  readonly key: readonly unknown[];
  /** データを取得する関数。 */
  readonly load: (() => Promise<Data>) | undefined;
  /** タブ内で取得結果を使い回す期間(ミリ秒)。 */
  readonly tabStaleTime?: number;
};

/** server のデータを読んだ結果。 */
export type ApiQueryResult<Data> =
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
      /** 取得したデータ。 */
      readonly data: Data;
    };

type MutationOptions<Input, Data> = {
  /** 同じ対象への送信をほかの画面と共有するキー。 */
  readonly key?: readonly unknown[];
  /** 同じ対象の送信を順に実行する識別子。 */
  readonly scope?: string;
  /** 操作を送る関数。 */
  readonly send: (input: Input) => Promise<Data>;
  /** `send` の Promise が resolve した後に呼ぶ関数。 */
  readonly onSuccess: (data: Data, input: Input) => void | Promise<void>;
  /** 送信か送信後の処理が、セッション切れのほかの失敗で終わったときに呼ぶ関数。 */
  readonly onError?: (input: Input) => void;
};

type MutationResult<Input, Data> = {
  /** 操作を送る関数。 */
  readonly mutate: (input: Input) => void;
  /** 送信の状態と結果を消す関数。 */
  readonly reset: () => void;
  /** 送信または送信後の処理を待っているか。 */
  readonly isPending: boolean;
  /** 送信または送信後の処理が error で終わったか。 */
  readonly isError: boolean;
  /** `send` が返した操作の結果。 */
  readonly data: Data | undefined;
};

type ApiCache = {
  /** 取得を中断してから、使う画面の無い取得も含めて取り直す関数。 */
  readonly refresh: (
    key: readonly unknown[],
    refetchType?: "all" | "active",
  ) => Promise<void>;
  /** 取得を中断し、取り直さずにデータを差し替える関数。 */
  readonly replace: (key: readonly unknown[], data: unknown) => Promise<void>;
  /** 取得済みのデータに変更を反映する関数。 */
  readonly update: <Data>(
    key: readonly unknown[],
    apply: (data: Data) => Data,
  ) => Promise<void>;
  /** 取得済みの一覧のページを、server の書き換えの結果に合わせる関数。 */
  readonly updatePages: <Page>(
    key: readonly unknown[],
    update: (page: Page) => Page,
  ) => Promise<void>;
  /** 取得と送信のキャッシュを消す関数。 */
  readonly clear: () => void;
};

/** server のデータを読み、取得の状態を返す。 */
export const useApiQuery = <Data>({
  key,
  load,
  keepDataOnRefreshError,
  tabStaleTime,
}: QueryOptions<Data>): ApiQueryResult<Data> => {
  const query = useQuery({
    queryKey: key,
    queryFn: load ?? skipToken,
    ...(load === undefined || tabStaleTime === undefined
      ? {}
      : { staleTime: tabStaleTime, gcTime: Infinity }),
  });

  if (query.isPending && query.errorUpdateCount === 0) {
    return { _tag: "Loading" };
  }

  if (
    tabStaleTime !== undefined &&
    query.isRefetchError &&
    !isUnauthorized(query.error)
  ) {
    return { _tag: "Loaded", data: query.data };
  }

  if (keepDataOnRefreshError === true && query.isRefetchError && !isUnauthorized(query.error)) {
    return { _tag: "Loaded", data: query.data };
  }

  if (query.isPending || query.isError) {
    return {
      _tag: "Failed",
      isRetrying: query.fetchStatus !== "idle", // 次の試行を待って一時停止している間も、取り直している
      retry: () => {
        void query.refetch();
      },
    };
  }

  return { _tag: "Loaded", data: query.data };
};

/** 画面が使う取得のうち、まだデータの無いものを待っているかを返す。 */
export const useIsLoadingFirstData = (): boolean =>
  useIsFetching({
    predicate: (query) =>
      query.state.data === undefined && query.getObserversCount() > 0,
  }) > 0;

/** 同じキーで送った操作の応答を待っているか。 */
export const useIsApiMutationPending = (key: readonly unknown[]): boolean =>
  useIsMutating({ mutationKey: key, exact: true }) > 0;

/** server に操作を送り、送信の状態と結果を返す。 */
export const useApiMutation = <Data, Input = void>({
  key,
  scope,
  send,
  onSuccess,
  onError,
}: MutationOptions<Input, Data>): MutationResult<Input, Data> => {
  const { mutate, reset, isPending, isError, data } = useMutation({
    ...(key && { mutationKey: key }),
    ...(scope === undefined ? {} : { scope: { id: scope } }),
    mutationFn: (input: Input) => send(input),
    onSuccess,
    onError: (error, input) => {
      if (!isUnauthorized(error)) {
        onError?.(input);
      }
    },
  });

  return {
    mutate: (input) => {
      mutate(input);
    },
    reset,
    isPending,
    isError,
    data,
  };
};

const loadingMore = (query: Pick<Query, "state">): boolean =>
  query.state.fetchStatus !== "idle" &&
  query.state.fetchMeta?.fetchMore?.direction === "forward";

/** server のデータを取り直し、状態を消すための関数を返す。 */
export const useApiCache = (): ApiCache => {
  const client = useQueryClient();

  const update = async <Data>(
    key: readonly unknown[],
    apply: (data: Data) => Data,
  ): Promise<void> => {
    const match = { queryKey: key, exact: true };

    const cache = client.getQueryCache();
    const query = cache.find<Data>({ queryKey: key, exact: true });

    if (query === undefined) return;

    if (loadingMore(query)) {
      await Promise.allSettled([query.promise]);
    } else {
      await client.cancelQueries(match);
    }

    if (cache.get(query.queryHash) !== query) return;

    if (query.state.data !== undefined) {
      query.setState({ data: apply(query.state.data) });
    }

    if (query.state.data === undefined || query.state.isInvalidated) {
      void client.invalidateQueries({ ...match, refetchType: "active" });
    }
  };

  return {
    refresh: async (key, refetchType = "all") => {
      const matches = client.getQueryCache().findAll({ queryKey: key });
      await Promise.all(
        matches.map(async (query) => {
          if (loadingMore(query)) await Promise.allSettled([query.promise]);
          else {
            await client.cancelQueries({
              queryKey: query.queryKey,
              exact: true,
            });
          }
        }),
      );
      await client.invalidateQueries(
        { queryKey: key, refetchType },
        { cancelRefetch: false },
      );
    },
    replace: async (key, data) => {
      await client.cancelQueries({ queryKey: key });
      client.setQueryData(key, data);
    },
    update,
    updatePages: <Page>(key: readonly unknown[], apply: (page: Page) => Page) =>
      update<InfiniteData<Page>>(key, (data) => ({
        ...data,
        pages: data.pages.map(apply),
      })),
    clear: () => {
      client.clear();
    },
  };
};
