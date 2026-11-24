import { useQuery } from "@tanstack/react-query";

/** 読み直しを続ける値。 */
type ApiPollingOptions<Data> = {
  /** query のキー。 */
  readonly key: readonly unknown[];
  /** データを取得する関数。 */
  readonly load: () => Promise<Data>;
  /** 読み直すまでのミリ秒(読み直さないなら false)。 */
  readonly interval: (data: Data | undefined) => number | false;
};

/** 取得したデータが続けて変わる間、間を置いて読み直す。 */
export const useApiPolling = <Data>({
  key,
  load,
  interval,
}: ApiPollingOptions<Data>): void => {
  useQuery<Data>({
    queryKey: key,
    queryFn: load,
    refetchInterval: (query) => interval(query.state.data),
    notifyOnChangeProps: [],
  });
};
