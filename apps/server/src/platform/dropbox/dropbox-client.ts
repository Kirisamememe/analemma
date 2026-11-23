import { z } from "zod";

const AUTHORIZE_URL = "https://www.dropbox.com/oauth2/authorize";
const TOKEN_URL = "https://api.dropboxapi.com/oauth2/token";

/** Dropbox の許可の画面へ渡す値。 */
export type AuthorizeRequest = {
  /** 戻ってきたリクエストを照らし合わせる state。 */
  readonly state: string;
  /** PKCE の code_challenge(S256)。 */
  readonly codeChallenge: string;
  /** 許可した後に戻る URL。 */
  readonly redirectUri: string;
};

/** 許可の画面から戻った code を、token に替えるときに渡す値。 */
export type CodeExchange = {
  /** Dropbox が戻り先に付けた code。 */
  readonly code: string;
  /** PKCE の code_verifier。 */
  readonly codeVerifier: string;
  /** 許可の画面に渡した、戻る URL。 */
  readonly redirectUri: string;
};

/** code を替えて受け取った、Dropbox の資格情報。 */
export type ExchangedTokens = {
  /** どの結果か。 */
  readonly _tag: "Exchanged";
  /** 期限の無い refresh token。 */
  readonly refreshToken: string;
  /** Dropbox のアカウントの ID。 */
  readonly accountId: string;
};

/** Dropbox が code を断ったこと。 */
export type RejectedCode = {
  /** どの結果か。 */
  readonly _tag: "Rejected";
};

/** Dropbox の API を呼ぶ処理。 */
export type DropboxClient = {
  /** Dropbox の、許可を求める画面の URL を作る。 */
  readonly authorizeUrl: (request: AuthorizeRequest) => string;
  /** 許可の画面から戻った code を、refresh token に替える。 */
  readonly exchangeCode: (
    exchange: CodeExchange,
  ) => Promise<ExchangedTokens | RejectedCode>;
};

/** Dropbox に送る、fetch と同じ形の関数。 */
export type DropboxFetch = (
  input: Request | string | URL,
  init?: RequestInit,
) => Promise<Response>;

/** Dropbox の API を呼ぶときの、アプリの設定と通信の関数。 */
export type DropboxClientOptions = {
  /** Dropbox に登録したアプリの app key。 */
  readonly appKey: string;
  /** Dropbox に送る fetch。 */
  readonly fetch: DropboxFetch;
};

const tokenResponse = z.object({
  refresh_token: z.string().min(1),
  account_id: z.string().min(1),
});

/** Dropbox の API を呼ぶ処理を作る。 */
export const createDropboxClient = ({
  appKey,
  fetch: send,
}: DropboxClientOptions): DropboxClient => ({
  authorizeUrl: ({ state, codeChallenge, redirectUri }) => {
    const url = new URL(AUTHORIZE_URL);

    url.search = new URLSearchParams({
      client_id: appKey,
      response_type: "code",
      token_access_type: "offline",
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
      redirect_uri: redirectUri,
      state,
    }).toString();

    return url.toString();
  },
  exchangeCode: async ({ code, codeVerifier, redirectUri }) => {
    const response = await send(TOKEN_URL, {
      method: "POST",
      body: new URLSearchParams({
        code,
        grant_type: "authorization_code",
        code_verifier: codeVerifier,
        client_id: appKey,
        redirect_uri: redirectUri,
      }),
    });

    if (response.status === 400) {
      return { _tag: "Rejected" };
    }

    if (!response.ok) {
      throw new Error(
        `Dropbox が code を替えなかった(${String(response.status)})`,
      );
    }

    const tokens = tokenResponse.parse(await response.json());

    return {
      _tag: "Exchanged",
      refreshToken: tokens.refresh_token,
      accountId: tokens.account_id,
    };
  },
});
