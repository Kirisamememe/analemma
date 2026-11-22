import { z } from "zod";

import {
  type WebAuthnRejection,
  reject,
} from "@/features/auth/webauthn/rejection";

/** clientDataJSON のうち、検証に使う値。 */
export type ClientData = {
  /** どの結果か。 */
  readonly _tag: "Parsed";
  /** `webauthn.create` か `webauthn.get`。 */
  readonly type: string;
  /** server が出した challenge の base64url。 */
  readonly challenge: string;
  /** リクエストを作ったページの origin。 */
  readonly origin: string;
  /** ほかの origin の iframe の中で作られたか。 */
  readonly crossOrigin: boolean;
  /** `topOrigin` の項目があるか。 */
  readonly hasTopOrigin: boolean;
};

const clientDataSchema = z.object({
  type: z.string(),
  challenge: z.string(),
  origin: z.string(),
  crossOrigin: z.boolean().optional(),
});

const utf8 = new TextDecoder("utf-8");

const invalid = (problem: string): WebAuthnRejection =>
  reject(`clientDataJSON: ${problem}`);

/** clientDataJSON を読む。 */
export const parseClientData = (
  bytes: Uint8Array,
): ClientData | WebAuthnRejection => {
  const value: unknown = JSON.parse(utf8.decode(bytes));

  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return invalid("JSON のオブジェクトでない");
  }

  const parsed = clientDataSchema.safeParse(value);

  if (!parsed.success) {
    return invalid("type・challenge・origin・crossOrigin の型が違う");
  }

  return {
    _tag: "Parsed",
    type: parsed.data.type,
    challenge: parsed.data.challenge,
    origin: parsed.data.origin,
    crossOrigin: parsed.data.crossOrigin === true,
    hasTopOrigin: Object.hasOwn(value, "topOrigin"),
  };
};
