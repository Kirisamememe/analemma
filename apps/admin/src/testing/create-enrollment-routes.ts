import type { FakeReply, FakeRoutes } from "./create-fake-api";

const EXPIRY = { output: { expiresAt: "2026-01-08T00:00:00.000Z" } };

const ENROLLMENT_OPTIONS = {
  output: {
    challenge: "AQID",
    rp: { id: "localhost", name: "Analemma" },
    user: { id: "BAU", name: "admin", displayName: "管理者" },
    pubKeyCredParams: [{ type: "public-key", alg: -8 }],
    excludeCredentials: [],
    authenticatorSelection: {
      residentKey: "required",
      requireResidentKey: true,
      userVerification: "required",
    },
    attestation: "none",
    timeout: 300_000,
  },
};

/** 作り物の server と、server が受け取った登録。 */
export type EnrollmentServer = {
  /** 作り物の server の応答。 */
  readonly routes: FakeRoutes;
  /** server が受け取った登録の入力。 */
  readonly registered: () => unknown;
};

/** 登録用 URL から登録する前の、作り物の server を作る。 */
export const createEnrollmentRoutes = (
  register: FakeReply,
): EnrollmentServer => {
  let registered: unknown;

  return {
    routes: {
      "admin/session/get": () =>
        registered === undefined || !("output" in register)
          ? { error: "UNAUTHORIZED", status: 401 }
          : EXPIRY,
      "auth/enrollment/options": () => ENROLLMENT_OPTIONS,
      "auth/enrollment/register": (input) => {
        registered = input;

        return register;
      },
    },
    registered: () => registered,
  };
};
