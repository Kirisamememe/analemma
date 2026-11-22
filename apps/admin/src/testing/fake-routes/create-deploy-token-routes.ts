import type {
  FakeInput,
  FakeOutput,
  FakeReply,
  FakeRoutes,
} from "@/testing/create-fake-api";

/** 作り物の server に最初に置く、1つのデプロイ用のトークン。 */
export type FakeDeployTokenSeed = {
  /** 名前。 */
  readonly name: string;
  /** 最後に使った日時(使っていなければ null)。 */
  readonly lastUsedAt: string | null;
};

/** 作り物の server が持つ、1つのデプロイ用のトークン。 */
export type FakeDeployToken =
  FakeOutput<"admin/deployTokens/list">["tokens"][number];

type DeployTokenPath =
  | "admin/deployTokens/issue"
  | "admin/deployTokens/list"
  | "admin/deployTokens/revoke"
  | "admin/session/get"
  | "admin/session/reauthenticationOptions";

type DeployTokenReplies = { [Path in DeployTokenPath]: FakeReply<Path> };

type ReplyOverrides = {
  [Path in DeployTokenPath]?:
    | (() => DeployTokenReplies[Path] | Promise<DeployTokenReplies[Path]>)
    | undefined;
};

const SESSION_EXPIRES_AT = "2026-03-02T09:00:00.000Z";
const FIRST_ISSUE = Date.parse("2026-01-02T03:04:00.000Z");
const DAY = 86_400_000;
const ID_LENGTH = 22;

const AUTHENTICATION_OPTIONS: FakeOutput<"admin/session/reauthenticationOptions"> =
  {
    challenge: "AQID",
    rpId: "localhost",
    allowCredentials: [],
    userVerification: "required",
    timeout: 300_000,
  };

const toBase64Url = (text: string): string =>
  new TextEncoder()
    .encode(text)
    .toBase64({ alphabet: "base64url", omitPadding: true });

/** デプロイ用のトークンの procedure を、状態ごと真似る作り物の server の応答を作る。 */
export const createDeployTokenRoutes = (
  seeds: readonly FakeDeployTokenSeed[],
) => {
  let issued = 0;
  const nextSummary = (
    name: string,
    lastUsedAt: string | null,
  ): FakeDeployToken => {
    issued += 1;

    return {
      id: toBase64Url(`deploy-token-${String(issued)}`)
        .padEnd(ID_LENGTH, "A")
        .slice(0, ID_LENGTH),
      name,
      createdAt: new Date(FIRST_ISSUE + issued * DAY).toISOString(),
      lastUsedAt,
    };
  };

  let tokens: FakeDeployToken[] = seeds.map(({ name, lastUsedAt }) =>
    nextSummary(name, lastUsedAt),
  );
  let reauthentications = 0;
  const overrides: ReplyOverrides = {};

  const handle = <Path extends DeployTokenPath>(
    path: Path,
    success: (input: FakeInput<Path>) => DeployTokenReplies[Path],
  ) => {
    const replyBeforeInput = ():
      | DeployTokenReplies[Path]
      | Promise<DeployTokenReplies[Path]>
      | undefined => {
      const override = overrides[path];

      overrides[path] = undefined;

      return override?.();
    };

    return Object.assign(success, { replyBeforeInput });
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
      "admin/deployTokens/list": handle("admin/deployTokens/list", () => ({
        output: { tokens },
      })),
      "admin/deployTokens/issue": handle(
        "admin/deployTokens/issue",
        (input) => {
          if (reauthentications === 0) {
            return { error: "REAUTHENTICATION_FAILED" };
          }

          reauthentications -= 1;

          const summary = nextSummary(input.name, null);

          tokens = [...tokens, summary];

          return {
            output: {
              ...summary,
              token: `${summary.id}.${toBase64Url(`secret-of-${summary.id}`)}`,
            },
          };
        },
      ),
      "admin/deployTokens/revoke": handle(
        "admin/deployTokens/revoke",
        (input) => {
          if (!tokens.some(({ id }) => id === input.id)) {
            return { error: "NOT_FOUND" };
          }

          tokens = tokens.filter(({ id }) => id !== input.id);

          return { output: undefined };
        },
      ),
    } satisfies FakeRoutes,
    tokens: (): readonly FakeDeployToken[] => tokens,
    replyNext: <Path extends DeployTokenPath>(
      path: Path,
      reply: NonNullable<ReplyOverrides[Path]>,
    ): void => {
      overrides[path] = reply;
    },
  };
};
