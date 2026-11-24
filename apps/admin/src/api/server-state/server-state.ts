import {
  type InfiniteData,
  type Query,
  useIsFetching,
  useIsMutating,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import { isUnauthorized } from "@/api/api-errors";

export {
  useApiQuery,
  type ApiQueryResult,
  type QueryRetry,
} from "./use-api-query";

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

  return { mutate, reset, isPending, isError, data };
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
