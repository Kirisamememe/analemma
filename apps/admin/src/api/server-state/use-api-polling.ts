import { skipToken, useQuery } from "@tanstack/react-query";

type PollingOptions<Data> = {
  /** 結果を読む取得とは別にする、query のキー。 */
  readonly key: readonly unknown[];
  /** データを取得する関数。 */
  readonly load: (() => Promise<Data>) | undefined;
  /** 取得済みのデータから、取り直す間隔(ミリ秒)か、取り直さないことを決める関数。 */
  readonly every: (data: Data | undefined) => number | false;
};

/** 呼ぶ側に何も知らせずに、server のデータを一定の間隔で取り直す。 */
export const useApiPolling = <Data>({
  key,
  load,
  every,
}: PollingOptions<Data>): void => {
  useQuery<Data>({
    queryKey: key,
    queryFn: load ?? skipToken,
    refetchInterval: (polled) => every(polled.state.data),
    retry: false, // 次の取り直しが、失敗のやり直しになる
    notifyOnChangeProps: [],
  });
};
