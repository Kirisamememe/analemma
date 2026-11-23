import type { DropboxAppCredential } from "@/platform/dropbox/dropbox-oauth";

/** テストの Dropbox のアプリの app key と app secret。 */
export const TEST_DROPBOX_APP: DropboxAppCredential = {
  appKey: "testappkey",
  appSecret: "testappsecret",
};

/** テストの Dropbox のアカウント。 */
export const TEST_DROPBOX_ACCOUNT = {
  account_id: "dbid:test-account",
  name: { display_name: "Kirisame Test" },
  email: "photos@example.com",
};

/** 認可の画面から戻る URL に付く値。 */
export type FakeApproval = {
  /** code。 */
  readonly code: string;
  /** 認可の画面に渡した state。 */
  readonly state: string;
};

/** HTTP の API を真似る、作り物の Dropbox。 */
export type FakeDropbox = {
  /** Dropbox へのリクエストを受ける。 */
  readonly fetch: (request: Request) => Promise<Response>;
  /** 利用者が認可の画面で許したことにして、戻る URL の code と state を返す。 */
  readonly approve: (authorizeUrl: string) => FakeApproval;
  /** 利用者が Dropbox の設定からアプリの接続を切ったことにする。 */
  readonly unlink: () => void;
  /** 届いたリクエストの path。 */
  readonly requests: readonly string[];
};

const json = (body: unknown, status = 200): Response =>
  Response.json(body, { status });

const UNAUTHORIZED = (): Response =>
  json({ error_summary: "invalid_access_token/", error: {} }, 401);

/** HTTP の API を真似る、作り物の Dropbox を作る。 */
export const createFakeDropbox = (): FakeDropbox => {
  const codes = new Map<string, string>(); // code と、認可の画面に渡した redirect URI
  const grants = new Map<string, string>(); // access token と、その refresh token
  const refreshTokens = new Set<string>();
  const requests: string[] = [];

  const issueAccess = (refreshToken: string): string => {
    const accessToken = `access-${crypto.randomUUID()}`;

    grants.set(accessToken, refreshToken);

    return accessToken;
  };

  const token = async (request: Request): Promise<Response> => {
    const expected = `Basic ${btoa(`${TEST_DROPBOX_APP.appKey}:${TEST_DROPBOX_APP.appSecret}`)}`;

    if (request.headers.get("authorization") !== expected) {
      return json({ error: "invalid_client" }, 400);
    }

    const form = new URLSearchParams(await request.text());
    const invalidGrant = json({ error: "invalid_grant" }, 400);

    if (form.get("grant_type") === "refresh_token") {
      const refreshToken = form.get("refresh_token") ?? "";

      return refreshTokens.has(refreshToken)
        ? json({ access_token: issueAccess(refreshToken), expires_in: 14_400 })
        : invalidGrant;
    }

    const code = codes.get(form.get("code") ?? "");

    codes.delete(form.get("code") ?? "");

    if (code === undefined || code !== form.get("redirect_uri")) {
      return invalidGrant;
    }

    const refreshToken = `refresh-${crypto.randomUUID()}`;

    refreshTokens.add(refreshToken);

    return json({
      access_token: issueAccess(refreshToken),
      refresh_token: refreshToken,
      expires_in: 14_400,
      token_type: "bearer",
      account_id: TEST_DROPBOX_ACCOUNT.account_id,
    });
  };

  const api = (request: Request, path: string): Response => {
    const accessToken = /^Bearer (.+)$/v.exec(
      request.headers.get("authorization") ?? "",
    )?.[1];

    const refreshToken =
      accessToken === undefined ? undefined : grants.get(accessToken);

    if (refreshToken === undefined || !refreshTokens.has(refreshToken)) {
      return UNAUTHORIZED();
    }

    switch (path) {
      case "/2/auth/token/revoke": {
        refreshTokens.delete(refreshToken);

        return json(null);
      }
      case "/2/users/get_current_account": {
        return json(TEST_DROPBOX_ACCOUNT);
      }
      default: {
        return json({ error_summary: "not_found" }, 404);
      }
    }
  };

  return {
    fetch: async (request) => {
      const { pathname } = new URL(request.url);

      requests.push(pathname);

      return pathname === "/oauth2/token"
        ? token(request)
        : api(request, pathname);
    },
    approve: (authorizeUrl) => {
      const params = new URL(authorizeUrl).searchParams;
      const code = `code-${crypto.randomUUID()}`;

      codes.set(code, params.get("redirect_uri") ?? "");

      return { code, state: params.get("state") ?? "" };
    },
    unlink: () => {
      refreshTokens.clear();
    },
    requests,
  };
};
