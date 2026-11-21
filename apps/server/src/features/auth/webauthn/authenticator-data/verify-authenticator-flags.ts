import {
  PASSED,
  type WebAuthnPassed,
  type WebAuthnRejection,
  reject,
} from "../rejection";
import type { AuthenticatorData } from "./parse-authenticator-data";

/** authenticatorData と照らし合わせる値。 */
export type AuthenticatorExpectation = {
  /** RP ID。 */
  readonly rpId: string;
  /** 生体認証か PIN での本人の確認(UV)を求めるか。 */
  readonly requireUserVerification: boolean;
};

const invalid = (problem: string): WebAuthnRejection =>
  reject(`authenticatorData: ${problem}`);

const equalBytes = (left: Uint8Array, right: Uint8Array): boolean =>
  left.length === right.length &&
  left.every((byte, index) => byte === right[index]);

/** authenticatorData の rpIdHash と flags を、RP ID と UV の要否に照らす。 */
export const verifyAuthenticatorFlags = async (
  { flags, rpIdHash }: AuthenticatorData,
  { requireUserVerification, rpId }: AuthenticatorExpectation,
): Promise<WebAuthnPassed | WebAuthnRejection> => {
  const expectedHash = new Uint8Array(
    await crypto.subtle.digest("SHA-256", new TextEncoder().encode(rpId)),
  );

  if (!equalBytes(rpIdHash, expectedHash)) {
    return invalid("rpIdHash が RP ID のハッシュと違う");
  }

  if (!flags.userPresent) {
    return invalid("UP が立っていない");
  }

  if (requireUserVerification && !flags.userVerified) {
    return invalid("UV が立っていない");
  }

  return !flags.backupEligible && flags.backedUp
    ? invalid("BE が 0 なのに BS が 1")
    : PASSED;
};
