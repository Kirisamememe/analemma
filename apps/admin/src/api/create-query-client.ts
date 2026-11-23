import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";

import { isUnauthorized } from "@/api/api-errors";

/** query client を作るときに渡す値。 */
export type QueryClientOptions = {
  /** API がセッションの無いことを返したときに呼ぶ関数。 */
  readonly onUnauthorized: (queryClient: QueryClient) => void;
};

const MAX_RETRIES = 2;

/** 管理画面の、server の状態を持つ query client を作る。 */
export const createQueryClient = ({
  onUnauthorized,
}: QueryClientOptions): QueryClient => {
  const onError = (error: Error): void => {
    if (isUnauthorized(error)) {
      onUnauthorized(queryClient);
    }
  };

  const queryCache = new QueryCache({ onError });

  queryCache.subscribe((event) => {
    if (event.type !== "observerRemoved") return;

    setTimeout(() => {
      if (event.query.getObserversCount() === 0) queryCache.remove(event.query); // 取得の途中でも、使う画面の無いデータを持たない
    }, 0);
  });

  const queryClient: QueryClient = new QueryClient({
    queryCache,
    mutationCache: new MutationCache({ onError }),
    defaultOptions: {
      queries: {
        gcTime: 0, // 使う画面が無くなったデータを、メモリに持たない
        refetchOnWindowFocus: false,
        networkMode: "always",
        retry: (failures, error) =>
          !isUnauthorized(error) && failures < MAX_RETRIES,
      },
      mutations: { gcTime: 0, retry: false, networkMode: "always" },
    },
  });

  return queryClient;
};
