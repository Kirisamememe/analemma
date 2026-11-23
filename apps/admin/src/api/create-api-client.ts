import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";

import type { ApiClient } from "@/api/api-types";

/** リクエストの送り方(リダイレクトの扱い)。 */
type SendInit = {
  /** リダイレクトの扱い。 */
  readonly redirect?: RequestRedirect;
};

/** API の client を作るときに渡す値。 */
export type ApiClientOptions = {
  /** 管理画面の origin(API は同じ origin の `/api` にある)。 */
  readonly origin: string;
  /** リクエストを送る関数。 */
  readonly fetch: (request: Request, init: SendInit) => Promise<Response>;
};

/** 同じ origin の `/api` に、oRPC のプロトコルで送る client を作る。 */
export const createApiClient = ({
  origin,
  fetch,
}: ApiClientOptions): ApiClient =>
  createORPCClient(
    new RPCLink({
      url: new URL("/api", origin).href,
      fetch: async (request, init) => fetch(request, init),
    }),
  );
