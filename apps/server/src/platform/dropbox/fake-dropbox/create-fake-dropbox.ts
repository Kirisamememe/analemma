import type { DropboxFetch } from "@/platform/dropbox/dropbox-client";

const TOKEN_URL = "https://api.dropboxapi.com/oauth2/token";

/** 許可の画面から戻り先へ付けて返す値。 */
export type ApprovedRedirect = {
  /** token に替える code。 */
  readonly code: string;
  /** 許可の画面に渡された state。 */
  readonly state: string;
};

/** テストで使う、作り物の Dropbox。 */
export type FakeDropbox = {
  /** 作り物の Dropbox の API に送る fetch。 */
  readonly fetch: DropboxFetch;
  /** 許可の画面で管理者が許可したことにし、戻り先に付ける code と state を返す。 */
  readonly approve: (authorizeUrl: string) => ApprovedRedirect;
  /** これまでに出した refresh token。 */
  readonly refreshTokens: () => readonly string[];
};

/** 出した code と、そのときの許可の求め。 */
type IssuedCode = {
  /** PKCE の code_challenge。 */
  readonly codeChallenge: string;
  /** 戻る URL。 */
  readonly redirectUri: string;
};

const toChallenge = async (verifier: string): Promise<string> =>
  new Uint8Array(
    await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier)),
  ).toBase64({ alphabet: "base64url", omitPadding: true });

const invalidGrant = (): Response =>
  Response.json({ error: "invalid_grant" }, { status: 400 });

/** 作り物の Dropbox を、アプリの app key で作る。 */
export const createFakeDropbox = (appKey: string): FakeDropbox => {
  const codes = new Map<string, IssuedCode>();
  const refreshTokens: string[] = [];

  const exchange = async (form: URLSearchParams): Promise<Response> => {
    const code = form.get("code") ?? "";
    const issued = codes.get(code);

    codes.delete(code);

    if (
      issued === undefined ||
      form.get("grant_type") !== "authorization_code" ||
      form.get("client_id") !== appKey ||
      form.get("redirect_uri") !== issued.redirectUri ||
      (await toChallenge(form.get("code_verifier") ?? "")) !==
        issued.codeChallenge
    ) {
      return invalidGrant();
    }

    const refreshToken = `refresh-${String(refreshTokens.length + 1)}`;

    refreshTokens.push(refreshToken);

    return Response.json({
      access_token: "access-token",
      token_type: "bearer",
      expires_in: 14_400,
      refresh_token: refreshToken,
      account_id: "dbid:fake-account",
      uid: "1",
    });
  };

  return {
    fetch: async (input, init) => {
      const request =
        input instanceof Request
          ? new Request(input, init)
          : new Request(input.toString(), init);

      if (request.method === "POST" && request.url === TOKEN_URL) {
        return exchange(new URLSearchParams(await request.text()));
      }

      return new Response(null, { status: 404 });
    },
    approve: (authorizeUrl) => {
      const { searchParams } = new URL(authorizeUrl);

      if (
        searchParams.get("client_id") !== appKey ||
        searchParams.get("response_type") !== "code" ||
        searchParams.get("code_challenge_method") !== "S256"
      ) {
        throw new Error("作り物の Dropbox が受けない許可の求めです");
      }

      const code = `code-${String(codes.size + refreshTokens.length + 1)}`;

      codes.set(code, {
        codeChallenge: searchParams.get("code_challenge") ?? "",
        redirectUri: searchParams.get("redirect_uri") ?? "",
      });

      return { code, state: searchParams.get("state") ?? "" };
    },
    refreshTokens: () => refreshTokens,
  };
};
