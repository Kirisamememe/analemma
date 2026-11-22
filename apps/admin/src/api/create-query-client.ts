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

  const queryClient: QueryClient = new QueryClient({
    queryCache: new QueryCache({ onError }),
    mutationCache: new MutationCache({ onError }),
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        networkMode: "always",
        retry: (failures, error) =>
          !isUnauthorized(error) && failures < MAX_RETRIES,
      },
      mutations: { retry: false, networkMode: "always" },
    },
  });

  return queryClient;
};
