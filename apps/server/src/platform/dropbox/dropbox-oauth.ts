import { z } from "zod";

import type { DropboxApi } from "@/platform/dropbox/dropbox-api";

/** Dropbox のアプリの app key と app secret。 */
export type DropboxAppCredential = {
  /** App Console の app key(OAuth の client_id)。 */
  readonly appKey: string;
  /** App Console の app secret(OAuth の client_secret)。 */
  readonly appSecret: string;
};

/** Dropbox への HTTP のリクエストを送る関数。 */
export type DropboxFetch = (request: Request) => Promise<Response>;

const AUTHORIZE_URL = "https://www.dropbox.com/oauth2/authorize";
const TOKEN_URL = "https://api.dropboxapi.com/oauth2/token";
const REVOKE_URL = "https://api.dropboxapi.com/2/auth/token/revoke";
const SCOPES = "account_info.read files.metadata.read files.content.read";
const STATE_BYTES = 32;

const tokenResponse = z.object({
  access_token: z.string().min(1),
  expires_in: z.int().positive(),
});

const exchangeResponse = tokenResponse.extend({
  refresh_token: z.string().min(1),
});

const tokenError = z.object({ error: z.string() });

const randomText = (length: number): string =>
  crypto
    .getRandomValues(new Uint8Array(length))
    .toBase64({ alphabet: "base64url", omitPadding: true });

const isInvalidGrant = async (response: Response): Promise<boolean> =>
  response.status === 400 &&
  tokenError.safeParse(await response.json()).data?.error === "invalid_grant";

const TOO_MANY_REQUESTS = 429;

const isRefusal = ({ status }: Response): boolean =>
  status >= 400 && status < 500 && status !== TOO_MANY_REQUESTS;

const unexpected = (action: string, response: Response): Error =>
  new Error(`Dropbox の ${action} が ${response.status} を返した`);

/** Dropbox の OAuth の認可と token を扱う部分を作る。 */
export const createDropboxOAuth = (
  { appKey, appSecret }: DropboxAppCredential,
  send: DropboxFetch,
): Pick<DropboxApi, "authorize" | "exchangeCode" | "refresh" | "revoke"> => {
  const basic = `Basic ${btoa(`${appKey}:${appSecret}`)}`;

  const postToken = async (
    form: Record<string, string>,
    signal: AbortSignal | undefined,
  ): Promise<Response> =>
    send(
      new Request(TOKEN_URL, {
        method: "POST",
        headers: { authorization: basic },
        body: new URLSearchParams(form),
        signal: signal ?? null,
      }),
    );

  return {
    authorize: (redirectUri) => {
      const state = randomText(STATE_BYTES);
      const url = new URL(AUTHORIZE_URL);

      url.search = new URLSearchParams({
        client_id: appKey,
        response_type: "code",
        redirect_uri: redirectUri,
        state,
        token_access_type: "offline",
        scope: SCOPES,
      }).toString();

      return { url: url.href, state };
    },
    exchangeCode: async ({ code, redirectUri }, signal) => {
      const response = await postToken(
        {
          grant_type: "authorization_code",
          code,
          redirect_uri: redirectUri,
        },
        signal,
      );

      if (response.ok) {
        const body = exchangeResponse.parse(await response.json());

        return {
          _tag: "Authorized",
          refreshToken: body.refresh_token,
          accessToken: body.access_token,
          expiresInSeconds: body.expires_in,
        };
      }

      if (await isInvalidGrant(response)) return { _tag: "Rejected" };

      throw unexpected("code の交換", response);
    },
    refresh: async (refreshToken, signal) => {
      const response = await postToken(
        { grant_type: "refresh_token", refresh_token: refreshToken },
        signal,
      );

      if (response.ok) {
        const body = tokenResponse.parse(await response.json());

        return {
          _tag: "Refreshed",
          accessToken: body.access_token,
          expiresInSeconds: body.expires_in,
        };
      }

      if (isRefusal(response)) return { _tag: "Revoked" };

      throw unexpected("token の更新", response);
    },
    revoke: async (accessToken, signal) => {
      const response = await send(
        new Request(REVOKE_URL, {
          method: "POST",
          headers: { authorization: `Bearer ${accessToken}` },
          signal: signal ?? null,
        }),
      );

      if (!response.ok && response.status !== 401) {
        throw unexpected("token の取り消し", response);
      }
    },
  };
};
