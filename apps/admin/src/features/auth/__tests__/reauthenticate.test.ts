import { describe, expect, test } from "bun:test";

import { createFakeApi } from "../../../testing/create-fake-api";
import {
  FAKE_ASSERTION,
  createFakeAuthenticator,
} from "../../../testing/create-fake-authenticator";
import { reauthenticate } from "../reauthenticate";

const OPTIONS = {
  challenge: "AQID",
  rpId: "localhost",
  allowCredentials: [],
  userVerification: "required",
  timeout: 300_000,
};

describe("reauthenticate", () => {
  test("再認証の options で今のパスキーに確かめさせ、資格情報を返す", async () => {
    const { api, calls } = createFakeApi({
      "admin/session/reauthenticationOptions": () => ({ output: OPTIONS }),
    });

    expect(
      await reauthenticate({ api, authenticator: createFakeAuthenticator() }),
    ).toEqual({ _tag: "Confirmed", assertion: FAKE_ASSERTION });
    expect(calls).toEqual(["admin/session/reauthenticationOptions"]);
  });

  test("認証器で取り消したら、取り消しとして返す", async () => {
    const { api } = createFakeApi({
      "admin/session/reauthenticationOptions": () => ({ output: OPTIONS }),
    });

    expect(
      await reauthenticate({
        api,
        authenticator: createFakeAuthenticator({
          authenticate: { _tag: "Cancelled" },
        }),
      }),
    ).toEqual({ _tag: "Cancelled" });
  });
});
