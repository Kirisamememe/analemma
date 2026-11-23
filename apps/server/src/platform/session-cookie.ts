import {
  type SetCookieOptions,
  deleteCookie,
  getCookie,
  setCookie,
} from "@orpc/server/helpers";

/** セッションの token を入れる Cookie の名前と属性。 */
type SessionCookie = {
  /** Cookie の名前。 */
  readonly name: string;
  /** `Secure` を付けるか。 */
  readonly secure: boolean;
};

/** 管理画面の origin から、セッションの Cookie の名前と属性を決める。 */
export const toSessionCookie = (origin: string): SessionCookie => {
  const secure = new URL(origin).protocol === "https:";

  return {
    name: secure ? "__Host-analemma_session" : "analemma_session",
    secure,
  };
};

/** リクエストのヘッダーからセッションの token を読む。 */
export const readSessionCookie = (
  headers: Headers,
  { name }: SessionCookie,
): string | undefined => getCookie(headers, name);

/** 応答に書くセッションの Cookie。 */
type SessionCookieWrite = {
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
