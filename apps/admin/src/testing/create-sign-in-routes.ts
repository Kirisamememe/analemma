import { contract } from "@analemma/contract";

import type { FakeReply, FakeRoutes } from "./create-fake-api";

const EXPIRY = { output: { expiresAt: "2026-01-08T00:00:00.000Z" } };

const LOGIN_OPTIONS = {
  output: {
    challenge: "AQID",
    rpId: "localhost",
    allowCredentials: [],
    userVerification: "required",
    timeout: 300_000,
  },
} satisfies FakeReply<"auth/login/options">;

/** ログインする前の、作り物の server の応答を作る。 */
export const createSignInRoutes = (verify: FakeReply<"auth/login/verify">) => {
  let signedIn = false;

  return {
    "admin/session/get": () => (signedIn ? EXPIRY : { error: "UNAUTHORIZED" }),
    "auth/login/options": () => LOGIN_OPTIONS,
    "auth/login/verify": () => {
      signedIn =
        "output" in verify &&
        contract.auth.login.verify["~orpc"].outputSchema?.safeParse(
          verify.output,
        ).success === true;

      return verify;
    },
  } satisfies FakeRoutes;
};
