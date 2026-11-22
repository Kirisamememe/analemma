import type { ApiOutputs } from "../../../api/api-types";
import { fromBase64Url } from "./base64url";

/** server が返す、パスキーの登録の options。 */
export type RegistrationOptions = ApiOutputs["auth"]["enrollment"]["options"];

const TRANSPORTS: ReadonlySet<string> = new Set<AuthenticatorTransport>([
  "ble",
  "hybrid",
  "internal",
  "nfc",
  "usb",
]);

const isTransport = (value: string): value is AuthenticatorTransport =>
  TRANSPORTS.has(value);

/** server の options を、`navigator.credentials.create()` に渡す形にする。 */
export const toCreationOptions = (
  options: RegistrationOptions,
): PublicKeyCredentialCreationOptions => ({
  challenge: fromBase64Url(options.challenge),
  rp: options.rp,
  user: { ...options.user, id: fromBase64Url(options.user.id) },
  pubKeyCredParams: options.pubKeyCredParams,
  excludeCredentials: options.excludeCredentials.map((credential) => ({
    type: credential.type,
    id: fromBase64Url(credential.id),
    transports: credential.transports.filter((transport) =>
      isTransport(transport),
    ),
  })),
  authenticatorSelection: options.authenticatorSelection,
  attestation: options.attestation,
  timeout: options.timeout,
});
