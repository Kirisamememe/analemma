import type {
  FakeInput,
  FakeOutput,
  FakeReply,
  FakeRoutes,
} from "@/testing/create-fake-api";

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

type PasskeyPath =
  | "admin/passkeys/delete"
  | "admin/passkeys/list"
  | "admin/passkeys/register"
  | "admin/passkeys/registrationOptions"
  | "admin/passkeys/rename"
  | "admin/session/get"
  | "admin/session/logOut"
  | "admin/session/logOutAll"
  | "admin/session/reauthenticationOptions";

type PasskeyReplies = { [Path in PasskeyPath]: FakeReply<Path> };

type ReplyOverrides = {
  [Path in PasskeyPath]?:
    | (() => PasskeyReplies[Path] | Promise<PasskeyReplies[Path]>)
    | undefined;
};

const SESSION_REQUIRED = {
  error: "UNAUTHORIZED",
} satisfies FakeReply<"admin/session/get">;

const SESSION_EXPIRES_AT = "2026-01-02T03:04:00.000Z";

/** 作り物のパスキーを登録した日時。 */
export const PASSKEY_CREATED_AT = "2026-01-02T03:04:00.000Z";

/** 作り物のパスキーを最後に使った日時。 */
export const PASSKEY_LAST_USED_AT = "2026-02-03T04:05:00.000Z";

const AUTHENTICATION_OPTIONS: FakeOutput<"admin/session/reauthenticationOptions"> =
  {
    challenge: "AQID",
    rpId: "localhost",
    allowCredentials: [],
    userVerification: "required",
    timeout: 300_000,
  };

const REGISTRATION_OPTIONS: FakeOutput<"admin/passkeys/registrationOptions"> = {
  challenge: AUTHENTICATION_OPTIONS.challenge,
  timeout: AUTHENTICATION_OPTIONS.timeout,
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

const summaryOf = (passkey: FakePasskey) => ({
  ...passkey,
  createdAt: PASSKEY_CREATED_AT,
  lastUsedAt: PASSKEY_LAST_USED_AT,
});

/** パスキーの管理の procedure を、状態ごと真似る作り物の server の応答を作る。 */
export const createPasskeyRoutes = (seeds: readonly FakePasskeySeed[]) => {
  let created = 0;
  const nextId = (): string => {
    created += 1;

    return btoa(`pk${String(created)}`).replace(/=+$/v, "");
  };

  let passkeys: FakePasskey[] = seeds.map((seed) => ({
    ...seed,
    id: nextId(),
  }));
  let signedIn = true;
  let reauthentications = 0;
  const overrides: ReplyOverrides = {};

  const handle = <Path extends PasskeyPath>(
    path: Path,
    success: (input: FakeInput<Path>) => PasskeyReplies[Path],
  ) => {
    const replyBeforeInput = ():
      | PasskeyReplies[Path]
      | Promise<PasskeyReplies[Path]>
      | typeof SESSION_REQUIRED
      | undefined => {
      const override = overrides[path];

      overrides[path] = undefined;

      if (override !== undefined) {
        return override();
      }

      return signedIn ? undefined : SESSION_REQUIRED;
    };

    return Object.assign(
      (input: FakeInput<Path>) =>
        signedIn ? success(input) : SESSION_REQUIRED,
      { replyBeforeInput },
    );
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
      "admin/session/logOut": handle("admin/session/logOut", () => {
        signedIn = false;

        return { output: undefined };
      }),
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
          return { error: "REAUTHENTICATION_FAILED" };
        }

        const added = {
          id: nextId(),
          name: input.name,
          backedUp: false,
        };

        passkeys = [...passkeys, added];

        return { output: summaryOf(added) };
      }),
      "admin/passkeys/rename": handle("admin/passkeys/rename", (input) => {
        const target = passkeys.find(({ id }) => id === input.id);

        if (target === undefined) {
          return { error: "NOT_FOUND" };
        }

        const renamed = { ...target, name: input.name };

        passkeys = passkeys.map((passkey) =>
          passkey.id === renamed.id ? renamed : passkey,
        );

        return { output: summaryOf(renamed) };
      }),
      "admin/passkeys/delete": handle("admin/passkeys/delete", (input) => {
        if (!consumeReauthentication()) {
          return { error: "REAUTHENTICATION_FAILED" };
        }

        const id = input.id;

        if (!passkeys.some((passkey) => passkey.id === id)) {
          return { error: "NOT_FOUND" };
        }

        if (passkeys.length === 1) {
          return { error: "LAST_PASSKEY" };
        }

        passkeys = passkeys.filter((passkey) => passkey.id !== id);

        return { output: undefined };
      }),
    } satisfies FakeRoutes,
    passkeys: (): readonly FakePasskey[] => passkeys,
    replyNext: <Path extends PasskeyPath>(
      path: Path,
      reply: NonNullable<ReplyOverrides[Path]>,
    ): void => {
      overrides[path] = reply;
    },
  };
};
