import { useQuery } from "@tanstack/react-query";

/** 取得したデータの一部を読む値。 */
type ApiDataOptions<Data, Selected> = {
  /** query のキー。 */
  readonly key: readonly unknown[];
  /** データを取得する関数(ほかの部品が読み直すときにも使う)。 */
  readonly load: () => Promise<Data>;
  /** 取得したデータのうち、部品が読む部分を取り出す関数。 */
  readonly select: (data: Data) => Selected;
};

/** ほかの部品が取得したデータのうち、取り出した部分が変わったときだけ描き直す。 */
export const useApiData = <Data, Selected>({
  key,
  load,
  select,
}: ApiDataOptions<Data, Selected>): Selected | undefined =>
  useQuery<Data, Error, Selected>({
    queryKey: key,
    queryFn: load,
    select,
    enabled: false,
  }).data;
