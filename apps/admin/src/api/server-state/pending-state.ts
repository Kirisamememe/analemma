import { useIsFetching, useIsMutating } from "@tanstack/react-query";

/** 画面が使う取得のうち、まだデータの無いものを待っているかを返す。 */
export const useIsLoadingFirstData = (): boolean =>
  useIsFetching({
    predicate: (query) =>
      query.state.data === undefined && query.getObserversCount() > 0,
  }) > 0;

/** 同じキーで送った操作の応答を待っているか。 */
export const useIsApiMutationPending = (key: readonly unknown[]): boolean =>
  useIsMutating({ mutationKey: key, exact: true }) > 0;
