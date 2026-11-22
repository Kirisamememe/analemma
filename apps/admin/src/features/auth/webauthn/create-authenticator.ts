import {
  authenticationCredential,
  registrationCredential,
} from "@analemma/contract";

import type { ApiInputs, ApiOutputs } from "../../../api/api-types";

/** server が返す、ログインと再認証の options。 */
export type AuthenticationOptions = ApiOutputs["auth"]["login"]["options"];

/** server が返す、パスキーの登録の options。 */
export type RegistrationOptions = ApiOutputs["auth"]["enrollment"]["options"];

/** server に送る、ログインの資格情報。 */
export type AuthenticationCredential = ApiInputs["auth"]["login"]["verify"];

/** server に送る、登録の資格情報。 */
export type RegistrationCredential =
  ApiInputs["auth"]["enrollment"]["register"]["credential"];

/** 認証器が資格情報を返したこと。 */
type Answered<Credential> = {
  /** 結果の種類。 */
  readonly _tag: "Answered";
  /** server に送る形にした資格情報。 */
  readonly credential: Credential;
};

/** 認証器が資格情報を返さなかったこと。 */
type NotAnswered = {
  /** キャンセルされたか、登録済みの認証器だったか。 */
  readonly _tag: "Cancelled" | "AlreadyRegistered";
};

/** 認証器に尋ねた結果。 */
export type AuthenticatorAnswer<Credential> =
  | Answered<Credential>
  | NotAnswered;

/** パスキーで確かめ、パスキーを作る、認証器の窓口。 */
export type Authenticator = {
  /** 今のパスキーで確かめる(ログインと再認証)。 */
  readonly authenticate: (
    options: AuthenticationOptions,
  ) => Promise<AuthenticatorAnswer<AuthenticationCredential>>;
  /** 新しいパスキーを作る(signal で途中で止められる)。 */
  readonly register: (
    options: RegistrationOptions,
    signal?: AbortSignal,
  ) => Promise<AuthenticatorAnswer<RegistrationCredential>>;
};

/** ブラウザの WebAuthn のうち、使うもの(資格情報は `toJSON()` の値で返す)。 */
export type WebAuthn = {
  /** JSON の options で、今のパスキーで確かめる。 */
  readonly get: (
    options: PublicKeyCredentialRequestOptionsJSON,
  ) => Promise<unknown>;
  /** JSON の options で、新しいパスキーを作る。 */
  readonly create: (
    options: PublicKeyCredentialCreationOptionsJSON,
    signal?: AbortSignal,
  ) => Promise<unknown>;
};

/** 認証器の応答を、server に送る形として読んだ結果。 */
type Decoded<Credential> =
  | {
      /** 読めたか。 */
      readonly success: true;
      /** 読んだ資格情報。 */
      readonly data: Credential;
    }
  | {
      /** 読めたか。 */
      readonly success: false;
    };

const CANCELLED = new Set(["NotAllowedError", "AbortError", "TimeoutError"]);

const ask = async <Credential>(
  request: () => Promise<unknown>,
  decode: (json: unknown) => Decoded<Credential>,
): Promise<AuthenticatorAnswer<Credential>> => {
  try {
    const json = await request();

    if (json === null) {
      return { _tag: "Cancelled" };
    }

    const decoded = decode(json);

    if (!decoded.success) {
      throw new Error("認証器の応答を、server に送る資格情報として読めません");
    }

    return { _tag: "Answered", credential: decoded.data };
  } catch (error) {
    if (error instanceof DOMException && CANCELLED.has(error.name)) {
      return { _tag: "Cancelled" };
    }

    if (error instanceof DOMException && error.name === "InvalidStateError") {
      return { _tag: "AlreadyRegistered" };
    }

    throw error;
  }
};

/** ブラウザの認証器に尋ねる窓口を作る。 */
export const createAuthenticator = (webAuthn: WebAuthn): Authenticator => ({
  authenticate: async (options) =>
    ask(
      async () => webAuthn.get(options),
      (json) => authenticationCredential.safeParse(json),
    ),
  register: async (options, signal) =>
    ask(
      async () => webAuthn.create(options, signal),
      (json) => registrationCredential.safeParse(json),
    ),
});
