import {
  PASSED,
  type WebAuthnPassed,
  type WebAuthnRejection,
  reject,
} from "../rejection";
import { parseClientData } from "./parse-client-data";

/** clientDataJSON と照らし合わせる値。 */
export type ClientDataExpectation = {
  /** 登録は `webauthn.create`、ログインは `webauthn.get`。 */
  readonly type: "webauthn.create" | "webauthn.get";
  /** server が出した challenge。 */
  readonly challenge: Uint8Array;
  /** 管理画面の origin。 */
  readonly origin: string;
};

const invalid = (problem: string): WebAuthnRejection =>
  reject(`clientDataJSON: ${problem}`);

/** clientDataJSON を、出した challenge と管理画面の origin に照らす。 */
export const verifyClientData = (
  clientDataJson: Uint8Array,
  expected: ClientDataExpectation,
): WebAuthnPassed | WebAuthnRejection => {
  const clientData = parseClientData(clientDataJson);

  if (clientData._tag === "Rejected") {
    return clientData;
  }

  if (clientData.type !== expected.type) {
    return invalid(`type が ${expected.type} でない`);
  }

  const challenge = expected.challenge.toBase64({
    alphabet: "base64url",
    omitPadding: true,
  });

  if (clientData.challenge !== challenge) {
    return invalid("challenge が出したものと違う");
  }

  if (clientData.origin !== expected.origin) {
    return invalid("origin が管理画面の origin と違う");
  }

  if (clientData.crossOrigin) {
    return invalid("crossOrigin が true");
  }

  return clientData.hasTopOrigin ? invalid("topOrigin がある") : PASSED;
};
