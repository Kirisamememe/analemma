import {
  type AuthorizationStore,
  createAuthorizationStore,
} from "@/features/dropbox/connection/authorization-store";
import {
  type DropboxClient,
  type DropboxFetch,
  createDropboxClient,
} from "@/platform/dropbox/dropbox-client";

/** Dropbox とつなぐための、アプリの設定と依存。 */
export type DropboxContext = {
  /** Dropbox の API を呼ぶ処理。 */
  readonly client: DropboxClient;
  /** refresh token を暗号にする鍵。 */
  readonly tokenKey: CryptoKey;
  /** Dropbox の許可の画面から戻る、管理画面の URL。 */
  readonly redirectUri: string;
  /** 出した許可の求めを覚えておく表。 */
  readonly authorizations: AuthorizationStore;
};

/** Dropbox とつなぐための設定。 */
export type DropboxSettings = {
  /** Dropbox に登録したアプリの app key。 */
  readonly appKey: string;
  /** refresh token を暗号にする、32 bytes の鍵。 */
  readonly tokenKey: Uint8Array<ArrayBuffer>;
  /** 管理画面の origin。 */
  readonly origin: string;
  /** Dropbox に送る fetch。 */
  readonly fetch: DropboxFetch;
};

/** 設定から、Dropbox とつなぐための依存を組み立てる。 */
export const createDropboxContext = async ({
  appKey,
  tokenKey,
  origin,
  fetch,
}: DropboxSettings): Promise<DropboxContext> => ({
  client: createDropboxClient({ appKey, fetch }),
  tokenKey: await crypto.subtle.importKey("raw", tokenKey, "AES-GCM", false, [
    "encrypt",
    "decrypt",
  ]),
  redirectUri: new URL("/dropbox/callback", origin).toString(),
  authorizations: createAuthorizationStore(),
});
