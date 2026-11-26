import { ORPCError, onError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";
import { ResponseHeadersPlugin } from "@orpc/server/plugins";
import { StandardRPCMatcher } from "@orpc/server/standard";
import { Hono, type MiddlewareHandler } from "hono";
import { bodyLimit } from "hono/body-limit";
import { csrf } from "hono/csrf";
import { HTTPException } from "hono/http-exception";
import { NONCE, secureHeaders } from "hono/secure-headers";
import { tryDecodeURIComponent } from "hono/utils/url";

import { PHOTO_MAX_BYTES } from "@analemma/contract";

import type { AppContext } from "@/context";
import { isSessionActive } from "@/features/auth/session/resume-session";
import { DELIVERY_IMAGE_PREFIX } from "@/features/images/delivery/delivery-image-path";
import { serveDeliveryImage } from "@/features/images/delivery/serve-delivery-image";
import { readSessionCookie, toSessionCookie } from "@/platform/session-cookie";
import type { AdminDist } from "@/platform/startup/load-admin-dist";
import { router } from "@/router";

const API_PREFIX = "/api";
const API_BODY_LIMIT = 1024 * 1024;
const API_METHODS = new Set(["GET", "POST"]);
const FILE_CONTENT_TYPE = "multipart/form-data"; // oRPC がファイルを読む本文の形
const PHOTO_UPLOAD_PROCEDURE = "admin/images/upload";
const PHOTO_BODY_LIMIT = PHOTO_MAX_BYTES + API_BODY_LIMIT; // 写真の外の部分は、ほかの API と同じ上限に収める
const MAX_PHOTO_UPLOADS = 2; // 変換している1枚と、次に変換する1枚
const PHOTO_RETRY_AFTER_SECONDS = 10;

const limitApiBody = bodyLimit({ maxSize: API_BODY_LIMIT });
const limitPhotoBody = bodyLimit({ maxSize: PHOTO_BODY_LIMIT });

const PERMISSIONS_POLICY =
  "publickey-credentials-create=(self), publickey-credentials-get=(self)";

/** 外部用のポートを待ち受ける実行環境が、アプリに渡す処理。 */
export type ExternalListener = {
  /** 写真の変換を待つリクエストの接続を、何も送り受けしなくても長く保つ関数。 */
  readonly keepAlive: (request: Request) => void;
};

/** 外部用のポートで受ける procedure。 */
export const externalRouter = { admin: router.admin, auth: router.auth };

/** 内部用のポートで受ける procedure。 */
export const internalRouter = { deploy: router.deploy, public: router.public };

/** API をつなぐアプリと、そこで受ける procedure。 */
type ApiMount = {
  /** API をつなぐアプリ。 */
  readonly app: Hono;
  /** 起動時に組み立てた依存。 */
  readonly context: AppContext;
  /** このアプリで受ける procedure。 */
  readonly procedures: typeof externalRouter | typeof internalRouter;
  /** リクエストの本文の大きさを制限する middleware。 */
  readonly limitBody: MiddlewareHandler;
};

const isDefect = (error: unknown, signal: AbortSignal | undefined): boolean =>
  signal?.aborted !== true &&
  (!(error instanceof ORPCError) || error.code === "INTERNAL_SERVER_ERROR");

const mountApi = ({ app, context, procedures, limitBody }: ApiMount): void => {
  const handler = new RPCHandler(procedures, {
    plugins: [new ResponseHeadersPlugin()],
    clientInterceptors: [
      onError((error, { signal }) => {
        if (isDefect(error, signal)) {
          context.logger.write({
            level: "error",
            message: "API の処理で想定外の失敗が起きた",
            details: { error },
          });
        }
      }),
    ],
  });

  app.use(`${API_PREFIX}/*`, limitBody);
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

const hasSession = async (
  context: AppContext,
  headers: Headers,
): Promise<boolean> => {
  const token = readSessionCookie(
    headers,
    toSessionCookie(context.relyingParty.origin),
  );

  return (
    token !== undefined &&
    isSessionActive({ db: context.db, token, now: context.clock.now() })
  );
};

const procedureMatcher = new StandardRPCMatcher();

procedureMatcher.init(externalRouter);

const isPhotoUpload = async (request: Request): Promise<boolean> => {
  const { pathname } = new URL(request.url);
  const path = pathname.replace(API_PREFIX, "").replaceAll(/^\/|\/$/gv, "");
  const match = await procedureMatcher.match(request.method, `/${path}`);

  return (
    match?.path.join("/") === PHOTO_UPLOAD_PROCEDURE &&
    (request.headers.get("content-type") ?? "").startsWith(FILE_CONTENT_TYPE)
  );
};

const limitExternalBody = (
  context: AppContext,
  listener: ExternalListener | undefined,
): MiddlewareHandler => {
  let photoUploads = 0;

  return async (c, next) => {
    if (
      !(await isPhotoUpload(c.req.raw)) ||
      !(await hasSession(context, c.req.raw.headers))
    ) {
      return limitApiBody(c, next);
    }

    if (photoUploads >= MAX_PHOTO_UPLOADS) {
      return c.body(null, 503, {
        "Retry-After": String(PHOTO_RETRY_AFTER_SECONDS),
      });
    }

    photoUploads += 1;
    using slot = new DisposableStack();
    slot.defer(() => {
      photoUploads -= 1;
    });
    listener?.keepAlive(c.req.raw);

    return await limitPhotoBody(c, next);
  };
};

const logDefects = (app: Hono, context: AppContext): void => {
  app.onError((error, c) => {
    if (error instanceof HTTPException) {
      return error.getResponse();
    }

    context.logger.write({
      level: "error",
      message: "HTTP の処理で想定外の失敗が起きた",
      details: { error },
    });

    return c.body(null, 500);
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

const STATIC_METHODS = "GET, HEAD";

const allowEmbeddingImages = (app: Hono): void => {
  app.use(`${DELIVERY_IMAGE_PREFIX}/*`, async (c, next) => {
    await next();
    c.header("Cross-Origin-Resource-Policy", "cross-origin");
  });
};

const mountDeliveryImages = (app: Hono, context: AppContext): void => {
  app.get(`${DELIVERY_IMAGE_PREFIX}/*`, async (c) =>
    serveDeliveryImage(context, c.req.raw),
  );
  app.all(`${DELIVERY_IMAGE_PREFIX}/*`, (c) =>
    c.body(null, 405, { Allow: STATIC_METHODS }),
  );
};

const HEAD_TAG = "<head>";

const withNonce = (html: string, nonce: string | undefined): string =>
  html.replace(
    HEAD_TAG,
    `${HEAD_TAG}<meta name="csp-nonce" content="${nonce ?? ""}">`,
  );

const mountAdminDist = (app: Hono, dist: AdminDist): void => {
  app.get("*", (c) => {
    const path = tryDecodeURIComponent(new URL(c.req.url).pathname);

    if (
      path.split("/").some((part) => part.startsWith(".")) ||
      path.includes("\\") ||
      path.startsWith("/api/")
    ) {
      return c.notFound();
    }

    const file = dist.files.get(path);
    const asset = path.startsWith("/assets/");

    if (file === undefined && asset) {
      return c.notFound();
    }

    if (file === undefined || path === "/index.html") {
      return c.body(withNonce(dist.index, c.get("secureHeadersNonce")), 200, {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      });
    }

    return c.body(file, 200, {
      "Content-Type": file.type,
      "Cache-Control": asset
        ? "public, max-age=31536000, immutable"
        : "no-cache",
    });
  });
  app.all("*", (c) => c.body(null, 405, { Allow: STATIC_METHODS }));
};

/** 外部用のポートのアプリに渡す、管理画面のビルドと実行環境の処理。 */
export type ExternalAppOptions = {
  /** 配信する管理画面のビルド。 */
  readonly dist?: AdminDist | undefined;
  /** 外部用のポートを待ち受ける実行環境が、アプリに渡す処理。 */
  readonly listener?: ExternalListener | undefined;
};

/** 管理用 API・認証用 API・配信用の画像と管理画面を、外部用のポートで配信するアプリを作る。 */
export const createExternalApp = (
  context: AppContext,
  { dist, listener }: ExternalAppOptions = {},
): Hono => {
  const app = new Hono();

  logDefects(app, context);
  allowEmbeddingImages(app);
  app.use(
    secureHeaders({
      contentSecurityPolicy: {
        frameAncestors: ["'none'"],
        ...(dist && {
          defaultSrc: ["'none'"],
          scriptSrc: ["'self'", ...dist.scriptHashes],
          styleSrc: ["'self'", NONCE],
          imgSrc: ["'self'", "blob:"],
          connectSrc: ["'self'"],
          baseUri: ["'none'"],
          formAction: ["'none'"],
          objectSrc: ["'none'"],
        }),
      },
      xFrameOptions: "DENY",
    }),
  );
  app.use(async (c, next) => {
    await next();
    c.header("Permissions-Policy", PERMISSIONS_POLICY);
  });
  addNoStore(app, [`${API_PREFIX}/admin/*`, `${API_PREFIX}/auth/*`]);
  app.use(`${API_PREFIX}/*`, csrf({ origin: context.relyingParty.origin }));
  mountApi({
    app,
    context,
    procedures: externalRouter,
    limitBody: limitExternalBody(context, listener),
  });
  mountDeliveryImages(app, context);

  if (dist !== undefined) {
    mountAdminDist(app, dist);
  }

  return app;
};

/** 公開 API とデプロイ用 API を、同じサーバーの中から受けるアプリを作る。 */
export const createInternalApp = (context: AppContext): Hono => {
  const app = new Hono();

  logDefects(app, context);
  addNoStore(app, [`${API_PREFIX}/deploy/*`]);
  mountApi({
    app,
    context,
    procedures: internalRouter,
    limitBody: limitApiBody,
  });

  return app;
};
