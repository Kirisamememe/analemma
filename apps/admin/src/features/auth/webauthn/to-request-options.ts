import type { ApiOutputs } from "../../../api/api-types";
import { fromBase64Url } from "./base64url";

/** server が返す、ログインと再認証の options。 */
export type AuthenticationOptions = ApiOutputs["auth"]["login"]["options"];

/** server の options を、`navigator.credentials.get()` に渡す形にする。 */
export const toRequestOptions = (
  options: AuthenticationOptions,
): PublicKeyCredentialRequestOptions => ({
  challenge: fromBase64Url(options.challenge),
  rpId: options.rpId,
  allowCredentials: [],
  userVerification: options.userVerification,
  timeout: options.timeout,
});
