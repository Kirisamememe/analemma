import type {
  AuthenticationCredential,
  Authenticator,
  AuthenticatorAnswer,
  RegistrationCredential,
} from "../features/auth/webauthn/create-authenticator";

/** 作り物の認証器が返す答え。 */
export type FakeAnswers = {
  /** 今のパスキーで確かめたときの答え。 */
  readonly authenticate?: AuthenticatorAnswer<AuthenticationCredential>;
  /** パスキーを作ったときの答え。 */
  readonly register?: AuthenticatorAnswer<RegistrationCredential>;
};

/** 作り物の認証器が返す、ログインと再認証の資格情報。 */
export const FAKE_ASSERTION: AuthenticationCredential = {
  id: "current-passkey",
  type: "public-key",
  response: {
    clientDataJSON: "AQ",
    authenticatorData: "Ag",
    signature: "Aw",
    userHandle: "BA",
  },
};

/** 作り物の認証器が返す、登録の資格情報。 */
export const FAKE_ATTESTATION: RegistrationCredential = {
  id: "new-passkey",
  type: "public-key",
  response: {
    clientDataJSON: "AQ",
    attestationObject: "Ag",
    transports: ["internal"],
  },
};

/** 決めた答えを返す、作り物の認証器を作る(既定は、どちらも答える)。 */
export const createFakeAuthenticator = ({
  authenticate = { _tag: "Answered", credential: FAKE_ASSERTION },
  register = { _tag: "Answered", credential: FAKE_ATTESTATION },
}: FakeAnswers = {}): Authenticator => ({
  authenticate: () => Promise.resolve(authenticate),
  register: () => Promise.resolve(register),
});
