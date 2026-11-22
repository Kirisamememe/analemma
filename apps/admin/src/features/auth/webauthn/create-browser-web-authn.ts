import type { WebAuthn } from "@/features/auth/webauthn/create-authenticator";

/** ブラウザが返す、JSON にできる公開鍵の資格情報。 */
export type JsonCredential = {
  /** 資格情報を JSON にする。 */
  readonly toJSON: () => unknown;
};

/** `navigator.credentials` のうち、使うもの。 */
export type CredentialsApi = {
  /** 今のパスキーで確かめる。 */
  readonly get: (
    options: CredentialRequestOptions,
  ) => Promise<JsonCredential | null>;
  /** 新しいパスキーを作る。 */
  readonly create: (
    options: CredentialCreationOptions,
  ) => Promise<JsonCredential | null>;
};

/** JSON の options を、ブラウザの形にする関数。 */
export type OptionsParser = {
  /** ログインの options をブラウザの形にする。 */
  readonly parseRequestOptionsFromJSON: (
    options: PublicKeyCredentialRequestOptionsJSON,
  ) => PublicKeyCredentialRequestOptions;
  /** 登録の options をブラウザの形にする。 */
  readonly parseCreationOptionsFromJSON: (
    options: PublicKeyCredentialCreationOptionsJSON,
  ) => PublicKeyCredentialCreationOptions;
};

/** `navigator.credentials` を、JSON の options と JSON の資格情報でつなぐ。 */
export const createBrowserWebAuthn = (
  credentials: CredentialsApi,
  parser: OptionsParser,
): WebAuthn => ({
  get: async (options) =>
    (
      await credentials.get({
        publicKey: parser.parseRequestOptionsFromJSON(options),
      })
    )?.toJSON() ?? null,
  create: async (options, signal) =>
    (
      await credentials.create({
        publicKey: parser.parseCreationOptionsFromJSON(options),
        ...(signal === undefined ? {} : { signal }),
      })
    )?.toJSON() ?? null,
});
