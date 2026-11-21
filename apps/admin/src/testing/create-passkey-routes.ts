import type { FakeReply, FakeRoutes } from "./create-fake-api";

/** 作り物の server が持つ、1つのパスキー。 */
export type FakePasskey = {
  /** 資格情報の ID。 */
  readonly id: string;
  /** 名前。 */
  readonly name: string;
  /** ほかの端末へ同期されているか。 */
  readonly backedUp: boolean;
};

/** 作り物の server の、パスキーとセッションの状態。 */
export type PasskeyServer = {
  /** 作り物の server の応答。 */
  readonly routes: FakeRoutes;
  /** 今あるパスキー。 */
  readonly passkeys: () => readonly FakePasskey[];
  /** 次の操作で返す失敗(1回だけ)。 */
  readonly failNext: (procedure: string, reply: FakeReply) => void;
};

const DATE = "2026-01-02T03:04:00.000Z";

const AUTHENTICATION_OPTIONS = {
  challenge: "AQID",
  rpId: "localhost",
  allowCredentials: [],
  userVerification: "required",
  timeout: 300_000,
};

const REGISTRATION_OPTIONS = {
  ...AUTHENTICATION_OPTIONS,
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
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const field = (input: unknown, name: string): string => {
  const value = isRecord(input) ? input[name] : undefined;

  return typeof value === "string" ? value : "";
};

const summaryOf = (passkey: FakePasskey) => ({
  ...passkey,
  createdAt: DATE,
  lastUsedAt: DATE,
});

/** パスキーの管理の procedure を真似る、作り物の server の応答を作る。 */
export const createPasskeyRoutes = (
  initial: readonly FakePasskey[],
): PasskeyServer => {
  let passkeys = [...initial];
  const failures = new Map<string, FakeReply>();
  const reply = (procedure: string, success: () => FakeReply): FakeReply => {
    const failure = failures.get(procedure);

    failures.delete(procedure);

    return failure ?? success();
  };

  return {
    routes: {
      "admin/session/get": () => ({ output: { expiresAt: DATE } }),
      "admin/session/reauthenticationOptions": () => ({
        output: AUTHENTICATION_OPTIONS,
      }),
      "admin/session/logOutAll": () =>
        reply("admin/session/logOutAll", () => ({ output: { loggedOut: 2 } })),
      "admin/passkeys/list": () => ({
        output: { passkeys: passkeys.map((passkey) => summaryOf(passkey)) },
      }),
      "admin/passkeys/registrationOptions": () => ({
        output: REGISTRATION_OPTIONS,
      }),
      "admin/passkeys/register": (input) =>
        reply("admin/passkeys/register", () => {
          const added = {
            id: `passkey-${String(passkeys.length + 1)}`,
            name: field(input, "name"),
            backedUp: false,
          };

          passkeys = [...passkeys, added];

          return { output: summaryOf(added) };
        }),
      "admin/passkeys/rename": (input) =>
        reply("admin/passkeys/rename", () => {
          const id = field(input, "id");
          const name = field(input, "name");

          passkeys = passkeys.map((passkey) =>
            passkey.id === id ? { ...passkey, name } : passkey,
          );

          return { output: summaryOf({ id, name, backedUp: false }) };
        }),
      "admin/passkeys/delete": (input) =>
        reply("admin/passkeys/delete", () => {
          passkeys = passkeys.filter(({ id }) => id !== field(input, "id"));

          return { output: undefined };
        }),
    },
    passkeys: () => passkeys,
    failNext: (procedure, failure) => {
      failures.set(procedure, failure);
    },
  };
};
