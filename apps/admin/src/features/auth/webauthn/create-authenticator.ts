import {
  type RegistrationOptions,
  toCreationOptions,
} from "./to-creation-options";
import {
  type Assertion,
  type Attestation,
  type AuthenticationCredential,
  type RegistrationCredential,
  toAuthenticationCredential,
  toRegistrationCredential,
} from "./to-credentials";
import {
  type AuthenticationOptions,
  toRequestOptions,
} from "./to-request-options";

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

/** ブラウザの `navigator.credentials` のうち、使うもの。 */
export type CredentialStore = {
  /** 今のパスキーで確かめる。 */
  readonly get: (options: CredentialRequestOptions) => Promise<unknown>;
  /** 新しいパスキーを作る。 */
  readonly create: (options: CredentialCreationOptions) => Promise<unknown>;
};

const isAssertion = (credential: unknown): credential is Assertion =>
  typeof credential === "object" &&
  credential !== null &&
  "id" in credential &&
  "response" in credential &&
  typeof credential.response === "object" &&
  credential.response !== null &&
  "authenticatorData" in credential.response;

const isAttestation = (credential: unknown): credential is Attestation =>
  typeof credential === "object" &&
  credential !== null &&
  "id" in credential &&
  "response" in credential &&
  typeof credential.response === "object" &&
  credential.response !== null &&
  "attestationObject" in credential.response;

const CANCELLED = new Set(["NotAllowedError", "AbortError", "TimeoutError"]);

const ask = async <Credential>(
  request: () => Promise<Credential | undefined>,
): Promise<AuthenticatorAnswer<Credential>> => {
  try {
    const credential = await request();

    return credential === undefined
      ? { _tag: "Cancelled" }
      : { _tag: "Answered", credential };
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
export const createAuthenticator = (store: CredentialStore): Authenticator => ({
  authenticate: async (options) =>
    ask(async () => {
      const credential = await store.get({
        publicKey: toRequestOptions(options),
      });

      return isAssertion(credential)
        ? toAuthenticationCredential(credential)
        : undefined;
    }),
  register: async (options, signal) =>
    ask(async () => {
      const credential = await store.create({
        publicKey: toCreationOptions(options),
        ...(signal === undefined ? {} : { signal }),
      });

      return isAttestation(credential)
        ? toRegistrationCredential(credential)
        : undefined;
    }),
});
