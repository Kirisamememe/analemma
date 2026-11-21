import { implement } from "@orpc/server";
import { getCookie } from "@orpc/server/helpers";

import { contract } from "@analemma/contract";

import type { RequestContext } from "./context";
import { resumeSession } from "./features/auth/session/resume-session";
import { toSessionCookie } from "./features/auth/session/to-session-cookie";
import {
  clearSessionCookie,
  writeSessionCookie,
} from "./features/auth/session/write-session-cookie";
import { verifyDeployToken } from "./features/deploy-tokens/verify-deploy-token";

const api = implement(contract).$context<RequestContext>();

const isSameOrigin = ({
  headers,
  method,
  relyingParty,
}: RequestContext): boolean => {
  const site = headers.get("sec-fetch-site");

  if (site !== null && site !== "same-origin") {
    return false;
  }

  return method === "GET" || headers.get("origin") === relyingParty.origin;
};

const rejectOrigin = (context: RequestContext): void => {
  context.logger.write({
    level: "warn",
    message: "管理画面の origin からでないリクエストを断った",
    details: {
      origin: context.headers.get("origin"),
      secFetchSite: context.headers.get("sec-fetch-site"),
    },
  });
};

const requireAdminOrigin = api.admin.middleware(
  async ({ context, errors, next }) => {
    if (!isSameOrigin(context)) {
      rejectOrigin(context);

      throw errors.FORBIDDEN();
    }

    return next();
  },
);

const requireAuthOrigin = api.auth.middleware(
  async ({ context, errors, next }) => {
    if (!isSameOrigin(context)) {
      rejectOrigin(context);

      throw errors.FORBIDDEN();
    }

    return next();
  },
);

const requireSession = api.admin.middleware(
  async ({ context, errors, next }) => {
    const cookie = toSessionCookie(context.relyingParty.origin);
    const token = getCookie(context.headers, cookie.name);

    if (token === undefined) {
      throw errors.UNAUTHORIZED();
    }

    const now = context.clock.now();
    const resumed = await resumeSession({ db: context.db, token, now });

    if (resumed._tag === "Invalid") {
      clearSessionCookie(context.resHeaders, cookie);

      throw errors.UNAUTHORIZED();
    }

    if (resumed.refreshed) {
      writeSessionCookie(context.resHeaders, {
        cookie,
        token,
        expiresAt: resumed.session.expiresAt,
        now,
      });
    }

    return next({ context: { session: resumed.session } });
  },
);

const BEARER = /^Bearer (?<token>\S+)$/iv;

const requireDeployToken = api.deploy.middleware(
  async ({ context, errors, next }) => {
    const token = BEARER.exec(context.headers.get("authorization") ?? "")
      ?.groups?.["token"];
    const verified =
      token === undefined
        ? undefined
        : await verifyDeployToken({
            db: context.db,
            token,
            now: context.clock.now(),
          });

    if (verified?._tag !== "Verified") {
      context.logger.write({
        level: "warn",
        message: "デプロイ用のトークンを確かめられなかった",
        details: { deployTokenId: verified?.id },
      });
      context.resHeaders.set("WWW-Authenticate", "Bearer");

      throw errors.UNAUTHORIZED();
    }

    return next({ context: { deployToken: { id: verified.id } } });
  },
);

/** 誰でも呼べる procedure を作る base。 */
export const publicProcedures = api.public;

/** セッション無しで呼ぶ、ログインと登録の procedure を作る base。 */
export const authProcedures = api.auth.use(requireAuthOrigin);

/** デプロイ用のトークンを持つ公開サイトだけが呼べる procedure を作る base。 */
export const deployProcedures = api.deploy.use(requireDeployToken);

/** ログイン中の管理者だけが呼べる procedure を作る base。 */
export const adminProcedures = api.admin
  .use(requireAdminOrigin)
  .use(requireSession);
