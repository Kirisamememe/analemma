import { authAccess } from "./access-errors";
import { sessionExpiry } from "./session";
import { authenticationCredential, authenticationOptions } from "./webauthn";

/** パスキーでログインする procedure の contract。 */
export const login = {
  options: authAccess
    .route({
      method: "POST",
      path: "/auth/login/options",
      summary: "ログインの options",
    })
    .output(authenticationOptions),
  verify: authAccess
    .errors({
      CHALLENGE_EXPIRED: { status: 400 },
      UNKNOWN_CREDENTIAL: { status: 401 },
      INVALID_CREDENTIAL: { status: 401 },
    })
    .route({ method: "POST", path: "/auth/login", summary: "ログイン" })
    .input(authenticationCredential)
    .output(sessionExpiry),
};
