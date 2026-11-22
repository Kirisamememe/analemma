import {
  type SetCookieOptions,
  deleteCookie,
  setCookie,
} from "@orpc/server/helpers";

import type { SessionCookie } from "@/features/auth/session/to-session-cookie";

/** 応答に書くセッションの Cookie。 */
export type SessionCookieWrite = {
  /** Cookie の名前と属性。 */
  readonly cookie: SessionCookie;
  /** Cookie に入れる token。 */
  readonly token: string;
  /** セッションが切れる日時。 */
  readonly expiresAt: Date;
  /** 応答を返す日時。 */
  readonly now: Date;
};

const attributesOf = ({ secure }: SessionCookie): SetCookieOptions => ({
  httpOnly: true,
  secure,
  sameSite: "strict",
  path: "/",
});

/** 応答のヘッダーに、セッションの token の Cookie を書く。 */
export const writeSessionCookie = (
  headers: Headers,
  { cookie, expiresAt, now, token }: SessionCookieWrite,
): void => {
  setCookie(headers, cookie.name, token, {
    ...attributesOf(cookie),
    maxAge: Math.max(
      0,
      Math.floor((expiresAt.getTime() - now.getTime()) / 1000),
    ),
  });
};

/** 応答のヘッダーで、セッションの Cookie を消させる。 */
export const clearSessionCookie = (
  headers: Headers,
  cookie: SessionCookie,
): void => {
  deleteCookie(headers, cookie.name, attributesOf(cookie));
};
