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
const NO_STORE_PATHS = [`${API_PREFIX}/admin/*`, `${API_PREFIX}/auth/*`];
const PERMISSIONS_POLICY =
  "publickey-credentials-create=(self), publickey-credentials-get=(self)";

const isDefect = (error: unknown): boolean =>
  !(error instanceof ORPCError) || error.code === "INTERNAL_SERVER_ERROR";

/** HTTP の層(Hono)に、API の procedure をつないだアプリを作る。 */
export const createApp = (context: AppContext): Hono => {
  const handler = new RPCHandler(router, {
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

  for (const path of NO_STORE_PATHS) {
    app.use(path, async (c, next) => {
      await next();
      c.header("Cache-Control", "no-store");
    });
  }

  app.use(csrf({ origin: context.relyingParty.origin }));
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

  return app;
};
