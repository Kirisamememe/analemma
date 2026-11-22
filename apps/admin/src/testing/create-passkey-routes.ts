import type { FakeReply, FakeRoutes } from "./create-fake-api";

/** 作り物の server に最初に置く、1つのパスキー。 */
export type FakePasskeySeed = {
  /** 名前。 */
  readonly name: string;
  /** ほかの端末へ同期されているか。 */
  readonly backedUp: boolean;
};

/** 作り物の server が持つ、1つのパスキー。 */
export type FakePasskey = FakePasskeySeed & {
  /** 資格情報の ID(base64url)。 */
  readonly id: string;
};

/** 作り物の server の、パスキーとセッションの状態。 */
export type PasskeyServer = {
  /** 作り物の server の応答。 */
  readonly routes: FakeRoutes;
  /** 今あるパスキー。 */
  readonly passkeys: () => readonly FakePasskey[];
  /** 次の1回だけ、決めた procedure の応答を差し替える。 */
  readonly replyNext: (
    procedure: string,
    reply: () => FakeReply | Promise<FakeReply>,
  ) => void;
};

const SESSION_EXPIRES_AT = "2026-01-02T03:04:00.000Z";

/** 作り物のパスキーを登録した日時。 */
export const PASSKEY_CREATED_AT = "2026-01-02T03:04:00.000Z";

/** 作り物のパスキーを最後に使った日時。 */
export const PASSKEY_LAST_USED_AT = "2026-02-03T04:05:00.000Z";

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

const UNAUTHORIZED: FakeReply = { error: "UNAUTHORIZED", status: 401 };
const REAUTHENTICATION_FAILED: FakeReply = {
  error: "REAUTHENTICATION_FAILED",
  status: 403,
};
const NOT_FOUND: FakeReply = { error: "NOT_FOUND", status: 404 };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const field = (input: unknown, name: string): string => {
  const value = isRecord(input) ? input[name] : undefined;

  return typeof value === "string" ? value : "";
};

const summaryOf = (passkey: FakePasskey) => ({
  ...passkey,
  createdAt: PASSKEY_CREATED_AT,
  lastUsedAt: PASSKEY_LAST_USED_AT,
});

/** パスキーの管理の procedure を、状態ごと真似る作り物の server の応答を作る。 */
export const createPasskeyRoutes = (
  seeds: readonly FakePasskeySeed[],
): PasskeyServer => {
  let created = 0;
  const nextId = (): string => {
    created += 1;

    return `pk${String(created)}`;
  };

  let passkeys: FakePasskey[] = seeds.map((seed) => ({
    ...seed,
    id: nextId(),
  }));
  let signedIn = true;
  let reauthentications = 0;
  const overrides = new Map<string, () => FakeReply | Promise<FakeReply>>();

  const handle =
    (procedure: string, success: (input: unknown) => FakeReply) =>
    async (input: unknown): Promise<FakeReply> => {
      const override = overrides.get(procedure);

      overrides.delete(procedure);

      if (override !== undefined) {
        return override();
      }

      return signedIn ? success(input) : UNAUTHORIZED;
    };

  const consumeReauthentication = (): boolean => {
    if (reauthentications === 0) {
      return false;
    }

    reauthentications -= 1;

    return true;
  };

  return {
    routes: {
      "admin/session/get": handle("admin/session/get", () => ({
        output: { expiresAt: SESSION_EXPIRES_AT },
      })),
      "admin/session/reauthenticationOptions": handle(
        "admin/session/reauthenticationOptions",
        () => {
          reauthentications += 1;

          return { output: AUTHENTICATION_OPTIONS };
        },
      ),
      "admin/session/logOutAll": handle("admin/session/logOutAll", () => {
        signedIn = false;

        return { output: { loggedOut: 2 } };
      }),
      "admin/passkeys/list": handle("admin/passkeys/list", () => ({
        output: { passkeys: passkeys.map((passkey) => summaryOf(passkey)) },
      })),
      "admin/passkeys/registrationOptions": handle(
        "admin/passkeys/registrationOptions",
        () => ({ output: REGISTRATION_OPTIONS }),
      ),
      "admin/passkeys/register": handle("admin/passkeys/register", (input) => {
        if (!consumeReauthentication()) {
          return REAUTHENTICATION_FAILED;
        }

        const added = {
          id: nextId(),
          name: field(input, "name"),
          backedUp: false,
        };

        passkeys = [...passkeys, added];

        return { output: summaryOf(added) };
      }),
      "admin/passkeys/rename": handle("admin/passkeys/rename", (input) => {
        const target = passkeys.find(({ id }) => id === field(input, "id"));

        if (target === undefined) {
          return NOT_FOUND;
        }

        const renamed = { ...target, name: field(input, "name") };

        passkeys = passkeys.map((passkey) =>
          passkey.id === renamed.id ? renamed : passkey,
        );

        return { output: summaryOf(renamed) };
      }),
      "admin/passkeys/delete": handle("admin/passkeys/delete", (input) => {
        if (!consumeReauthentication()) {
          return REAUTHENTICATION_FAILED;
        }

        const id = field(input, "id");

        if (!passkeys.some((passkey) => passkey.id === id)) {
          return NOT_FOUND;
        }

        if (passkeys.length === 1) {
          return { error: "LAST_PASSKEY", status: 409 };
        }

        passkeys = passkeys.filter((passkey) => passkey.id !== id);

        return { output: undefined };
      }),
    },
    passkeys: () => passkeys,
    replyNext: (procedure, reply) => {
      overrides.set(procedure, reply);
    },
  };
};
