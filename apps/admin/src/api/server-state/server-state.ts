import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

type QueryOptions<Data> = {
  /** query のキー。 */
  readonly key: readonly unknown[];
  /** データを取得する関数。 */
  readonly load: () => Promise<Data>;
};

type QueryResult<Data> =
  | {
      /** どの結果か。 */
      readonly _tag: "Loading";
    }
  | {
      /** どの結果か。 */
      readonly _tag: "Failed";
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
  /** 成功したときに呼ぶ関数。 */
  readonly onSuccess: (data: Data) => void | Promise<void>;
};

type MutationResult<Input, Data> = {
  /** 操作を送る関数。 */
  readonly mutate: (input: Input) => void;
  /** 送信の状態と結果を消す関数。 */
  readonly reset: () => void;
  /** 送信中か。 */
  readonly isPending: boolean;
  /** 送信が失敗したか。 */
  readonly isError: boolean;
  /** 送信の結果。 */
  readonly data: Data | undefined;
};

type ApiCache = {
  /** 取得を中断してから取り直す関数。 */
  readonly refresh: (key: readonly unknown[]) => Promise<void>;
  /** 取得と送信のキャッシュを消す関数。 */
  readonly clear: () => void;
};

/** server のデータを読み、取得の状態を返す。 */
export const useApiQuery = <Data>({
  key,
  load,
}: QueryOptions<Data>): QueryResult<Data> => {
  const query = useQuery({ queryKey: key, queryFn: () => load() });

  if (query.isPending) {
    return { _tag: "Loading" };
  }

  if (query.isError) {
    return { _tag: "Failed" };
  }

  return { _tag: "Loaded", data: query.data };
};

/** server に操作を送り、送信の状態と結果を返す。 */
export const useApiMutation = <Data, Input = void>({
  send,
  onSuccess,
}: MutationOptions<Input, Data>): MutationResult<Input, Data> => {
  const { mutate, reset, isPending, isError, data } = useMutation({
    mutationFn: (input: Input) => send(input),
    onSuccess: (result) => onSuccess(result),
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
      await client.invalidateQueries({ queryKey: key });
    },
    clear: () => {
      client.clear();
    },
  };
};
