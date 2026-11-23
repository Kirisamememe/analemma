import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { isUnauthorized } from "@/api/api-errors";

type QueryOptions<Data> = {
  /** query のキー。 */
  readonly key: readonly unknown[];
  /** データを取得する関数。 */
  readonly load: () => Promise<Data>;
  /** 使う画面が無くなったときに、取得したデータを捨てるか。 */
  readonly discardWhenUnused?: boolean;
};

type QueryResult<Data> =
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
  /** 操作を送る関数。 */
  readonly send: (input: Input) => Promise<Data>;
  /** `send` の Promise が resolve した後に呼ぶ関数。 */
  readonly onSuccess: (data: Data) => void | Promise<void>;
  /** 送信か送信後の処理が、セッション切れのほかの失敗で終わったときに呼ぶ関数。 */
  readonly onError?: () => void;
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
  readonly refresh: (key: readonly unknown[]) => Promise<void>;
  /** 取得を中断し、取り直さずにデータを差し替える関数。 */
  readonly replace: (key: readonly unknown[], data: unknown) => Promise<void>;
  /** 取得と送信のキャッシュを消す関数。 */
  readonly clear: () => void;
};

/** server のデータを読み、取得の状態を返す。 */
export const useApiQuery = <Data>({
  key,
  load,
  discardWhenUnused = false,
}: QueryOptions<Data>): QueryResult<Data> => {
  const query = useQuery({
    queryKey: key,
    queryFn: () => load(),
    ...(discardWhenUnused ? { gcTime: 0 } : {}),
  });

  if (query.isPending && query.errorUpdateCount === 0) {
    return { _tag: "Loading" };
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

/** server に操作を送り、送信の状態と結果を返す。 */
export const useApiMutation = <Data, Input = void>({
  send,
  onSuccess,
  onError,
}: MutationOptions<Input, Data>): MutationResult<Input, Data> => {
  const { mutate, reset, isPending, isError, data } = useMutation({
    mutationFn: (input: Input) => send(input),
    onSuccess: (result) => onSuccess(result),
    onError: (error) => {
      if (!isUnauthorized(error)) {
        onError?.();
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

/** server のデータを取り直し、状態を消すための関数を返す。 */
export const useApiCache = (): ApiCache => {
  const client = useQueryClient();

  return {
    refresh: async (key) => {
      await client.cancelQueries({ queryKey: key });
      await client.invalidateQueries({ queryKey: key, refetchType: "all" });
    },
    replace: async (key, data) => {
      await client.cancelQueries({ queryKey: key });
      client.setQueryData(key, data);
    },
    clear: () => {
      client.clear();
    },
  };
};
