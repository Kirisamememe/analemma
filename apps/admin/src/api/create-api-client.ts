import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";

import type {
  ApiClient,
  ApiClientContext,
  UploadProgressCallback,
} from "@/api/api-types";

type LinkContext = ApiClientContext & {
  /** oRPC が写真の送信用に組み立てた本文。 */
  readonly formData?: FormData;
};

/** リクエストの送り方。 */
type SendInit = {
  /** リダイレクトの扱い。 */
  readonly redirect?: RequestRedirect;
  /** 進み具合を計測する写真の本文と通知先。 */
  readonly upload?: {
    /** oRPC が組み立てた本文。 */
    readonly body: FormData;
    /** 送り終えた本文の割合を受け取る関数。 */
    readonly report: UploadProgressCallback;
  };
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
    new RPCLink<LinkContext>({
      url: new URL("/api", origin).href,
      clientInterceptors: [
        (options) => {
          const { request, context, path } = options;
          return context.onUploadProgress &&
            path.join("/") === "admin/images/upload" &&
            request.body instanceof FormData
            ? options.next({
                ...options,
                context: { ...context, formData: request.body },
              })
            : options.next();
        },
      ],
      adapterInterceptors: [
        ({ request, init, context }) =>
          context.formData && context.onUploadProgress
            ? fetch(request, {
                ...init,
                upload: {
                  body: context.formData,
                  report: context.onUploadProgress,
                },
              })
            : fetch(request, init),
      ],
    }),
  );
