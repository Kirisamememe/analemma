import type { FakeInput, FakeReply, FakeRoutes } from "./create-fake-api";

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
} satisfies FakeReply<"auth/enrollment/options">;

/** 登録用 URL から登録する前の、作り物の server を作る。 */
export const createEnrollmentRoutes = (
  register: FakeReply<"auth/enrollment/register">,
) => {
  let registered: FakeInput<"auth/enrollment/register"> | undefined;

  return {
    routes: {
      "admin/session/get": () =>
        registered === undefined || !("output" in register)
          ? { error: "UNAUTHORIZED" }
          : EXPIRY,
      "auth/enrollment/options": () => ENROLLMENT_OPTIONS,
      "auth/enrollment/register": (input) => {
        registered = input;

        return register;
      },
    } satisfies FakeRoutes,
    registered: () => registered,
  };
};
