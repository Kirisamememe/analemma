import type { RegistrationResponse } from "../verify-registration";
import {
  AUTHENTICATOR_FLAG,
  buildAuthenticatorData,
  hashRpId,
} from "./build-authenticator-data";
import { buildClientDataJson } from "./build-client-data-json";
import type { FakeAuthenticator } from "./create-fake-authenticator";
import { type CborInput, encodeCbor } from "./encode-cbor";

/** 登録の応答の作り方。 */
export type FakeRegistrationInput = {
  /** 応答を作る認証器。 */
  readonly authenticator: FakeAuthenticator;
  /** server が出した challenge。 */
  readonly challenge: Uint8Array;
  /** ページの origin。 */
  readonly origin: string;
  /** 認証器がハッシュにする RP ID。 */
  readonly rpId: string;
  /** clientDataJSON の type。 */
  readonly type?: string;
  /** clientDataJSON の crossOrigin。 */
  readonly crossOrigin?: boolean;
  /** clientDataJSON の topOrigin。 */
  readonly topOrigin?: string;
  /** authenticatorData の flags。 */
  readonly flags?: number;
  /** authenticatorData の後ろに足す余り。 */
  readonly trailing?: Uint8Array;
};

const F = AUTHENTICATOR_FLAG;

/** テストのために、テスト用の認証器で attestation の無い登録の応答を作る。 */
export const createFakeRegistration = async ({
  authenticator,
  challenge,
  crossOrigin = false,
  flags = F.UP | F.UV | F.BE | F.BS | F.AT,
  origin,
  rpId,
  topOrigin,
  trailing = new Uint8Array(),
  type = "webauthn.create",
}: FakeRegistrationInput): Promise<RegistrationResponse> => {
  const authData = buildAuthenticatorData({
    rpIdHash: await hashRpId(rpId),
    flags,
    signCount: 0,
    credential: authenticator,
  });

  return {
    clientDataJSON: buildClientDataJson({
      type,
      challenge,
      origin,
      crossOrigin,
      ...(topOrigin === undefined ? {} : { topOrigin }),
    }),
    attestationObject: encodeCbor(
      new Map<string, CborInput>([
        ["fmt", "none"],
        ["attStmt", new Map()],
        ["authData", new Uint8Array([...authData, ...trailing])],
      ]),
    ),
  };
};
