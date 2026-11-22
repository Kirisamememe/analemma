import { describe, expect, test } from "bun:test";

import {
  FAKE_ASSERTION,
  FAKE_ATTESTATION,
  createFakeAuthenticator,
} from "../create-fake-authenticator";

const OPTIONS = {
  challenge: "AQID",
  rpId: "localhost",
  allowCredentials: [],
  userVerification: "required" as const,
  timeout: 300_000,
};

describe("createFakeAuthenticator", () => {
  test("既定では、決まった資格情報で答える", async () => {
    const authenticator = createFakeAuthenticator();

    expect(await authenticator.authenticate(OPTIONS)).toEqual({
      _tag: "Answered",
      credential: FAKE_ASSERTION,
    });
    expect(
      (
        await authenticator.register({
          challenge: "AQID",
          rp: { id: "localhost", name: "Analemma" },
          user: { id: "BAU", name: "admin", displayName: "管理者" },
          pubKeyCredParams: [],
          excludeCredentials: [],
          authenticatorSelection: {
            residentKey: "required",
            requireResidentKey: true,
            userVerification: "required",
          },
          attestation: "none",
          timeout: 300_000,
        })
      )._tag,
    ).toBe("Answered");
    expect(FAKE_ATTESTATION.id).toBe("new-passkey");
  });

  test("決めた答えを返す", async () => {
    const authenticator = createFakeAuthenticator({
      authenticate: { _tag: "Cancelled" },
    });

    expect(await authenticator.authenticate(OPTIONS)).toEqual({
      _tag: "Cancelled",
    });
  });
});
