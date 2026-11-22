import { describe, expect, test } from "bun:test";

import { reauthenticate } from "@/features/auth/reauthenticate";
import { createFakeApi, type FakeOutput } from "@/testing/create-fake-api";
import {
  FAKE_ASSERTION,
  createFakeAuthenticator,
} from "@/testing/create-fake-authenticator";

const OPTIONS: FakeOutput<"admin/session/reauthenticationOptions"> = {
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
      await reauthenticate({
        api,
        authenticator: createFakeAuthenticator(),
        now: () => 1_000,
      }),
    ).toEqual({
      _tag: "Confirmed",
      assertion: FAKE_ASSERTION,
      expiresAt: 301_000,
    });
    expect(calls).toEqual(["admin/session/reauthenticationOptions"]);
  });

  test("認証器でキャンセルしたら、キャンセルとして返す", async () => {
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
