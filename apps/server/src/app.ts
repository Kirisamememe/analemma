import { ORPCError, onError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";
import { ResponseHeadersPlugin } from "@orpc/server/plugins";
import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { csrf } from "hono/csrf";
import { secureHeaders } from "hono/secure-headers";

import type { AppContext } from "./context";
import { router } from "./router";

const API_PREFIX = "/api";
const API_BODY_LIMIT = 1024 * 1024;
const API_METHODS = new Set(["GET", "POST"]);
const PERMISSIONS_POLICY =
  "publickey-credentials-create=(self), publickey-credentials-get=(self)";

/** 外部用のポートで受ける procedure。 */
export const externalRouter = { admin: router.admin, auth: router.auth };

/** 内部用のポートで受ける procedure。 */
export const internalRouter = { public: router.public };

/** API をつなぐアプリと、そこで受ける procedure。 */
type ApiMount = {
  /** API をつなぐアプリ。 */
  readonly app: Hono;
  /** 起動時に組み立てた依存。 */
  readonly context: AppContext;
  /** このアプリで受ける procedure。 */
  readonly procedures: typeof externalRouter | typeof internalRouter;
};

const isDefect = (error: unknown): boolean =>
  !(error instanceof ORPCError) || error.code === "INTERNAL_SERVER_ERROR";

const mountApi = ({ app, context, procedures }: ApiMount): void => {
  const handler = new RPCHandler(procedures, {
    plugins: [new ResponseHeadersPlugin()],
    clientInterceptors: [
      onError((error) => {
        if (isDefect(error)) {
          context.logger.write({
            level: "error",
            message: "API の処理で想定外の失敗が起きた",
            details: { error },
          });
        }
      }),
    ],
  });

  app.use(`${API_PREFIX}/*`, bodyLimit({ maxSize: API_BODY_LIMIT }));
  app.all(`${API_PREFIX}/*`, async (c) => {
    if (!API_METHODS.has(c.req.method)) {
      return c.body(null, 405, { Allow: [...API_METHODS].join(", ") });
    }

    const { matched, response } = await handler.handle(c.req.raw, {
      prefix: API_PREFIX,
      context: {
        ...context,
        method: c.req.method,
        headers: c.req.raw.headers,
        resHeaders: new Headers(),
      },
    });

    return matched ? c.newResponse(response.body, response) : c.notFound();
  });
};

const addNoStore = (app: Hono, paths: readonly string[]): void => {
  for (const path of paths) {
    app.use(path, async (c, next) => {
      await next();
      c.header("Cache-Control", "no-store");
    });
  }
};

/** 管理画面と認証用 API を、リバースプロキシの向こうのブラウザから受けるアプリを作る。 */
export const createExternalApp = (context: AppContext): Hono => {
  const app = new Hono();

  app.use(
    secureHeaders({
      contentSecurityPolicy: { frameAncestors: ["'none'"] },
      xFrameOptions: "DENY",
    }),
  );
  app.use(async (c, next) => {
    await next();
    c.header("Permissions-Policy", PERMISSIONS_POLICY);
  });
  addNoStore(app, [`${API_PREFIX}/admin/*`, `${API_PREFIX}/auth/*`]);
  app.use(csrf({ origin: context.relyingParty.origin }));
  mountApi({ app, context, procedures: externalRouter });

  return app;
};

/** 公開 API を、同じサーバーの中から受けるアプリを作る。 */
export const createInternalApp = (context: AppContext): Hono => {
  const app = new Hono();

  mountApi({ app, context, procedures: internalRouter });

  return app;
};
