import { type Middleware, ORPCError, implement } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";

import { contract } from "@analemma/contract";

import type { ApiClient } from "@/api/api-types";
import {
  type ApiClientOptions,
  createApiClient,
} from "@/api/create-api-client";

type Reply<Output, Code extends string> =
  | {
      /** procedure の出力。 */
      readonly output: Output;
    }
  | {
      /** contract に定義した失敗の code。 */
      readonly error: Code;
      /** contract に定義した失敗か。 */
      readonly defined?: true;
    }
  | {
      /** contract に定義していない失敗の code。 */
      readonly error: "INTERNAL_SERVER_ERROR";
      /** contract に定義した失敗か。 */
      readonly defined: false;
    };

type EarlyReply<Output, Code extends string> =
  | Reply<Output, Code>
  | Promise<Reply<Output, Code>>
  | undefined;

type ReplyHandler<Input, Output, Code extends string> = ((
  input: Input,
) => Reply<Output, Code> | Promise<Reply<Output, Code>>) & {
  /** 入力を検証する前に返す応答。 */
  readonly replyBeforeInput?: () => EarlyReply<Output, Code | "UNAUTHORIZED">;
};

/** 元の procedure の入力検証前の処理を引き継ぎ、通常の応答を差し替える。 */
export const wrapFakeRoute = <Input, Output, Code extends string>(
  original: ReplyHandler<Input, Output, Code>,
  handle: NoInfer<ReplyHandler<Input, Output, Code>>,
): ReplyHandler<Input, Output, Code> => {
  const { replyBeforeInput } = original;

  return replyBeforeInput === undefined
    ? handle
    : Object.assign((input: Input) => handle(input), { replyBeforeInput });
};

type ErrorFactory = (
  options?: Partial<Pick<Error, "message">>,
) => ORPCError<string, unknown>;

type HandlerOptions<Input, Code extends string> = {
  /** procedure の入力。 */
  readonly input: Input;
  /** contract に定義した失敗を作る関数。 */
  readonly errors: Record<Code, ErrorFactory>;
};

type ProcedureBuilder<Input, Output, Code extends string, Procedure> = {
  /** handler から procedure を作る関数。 */
  readonly handler: (
    handle: (options: HandlerOptions<Input, Code>) => Promise<Output>,
  ) => Procedure;
};

const unwrapReply = <Output, Code extends string>(
  reply: Reply<Output, Code>,
  errors: Partial<Record<Code, ErrorFactory>>,
): Output => {
  if ("output" in reply) {
    return reply.output;
  }

  const options = { message: reply.error };

  if (reply.defined === false) {
    throw new ORPCError(reply.error, options);
  }

  throw errors[reply.error]?.(options) ?? new ORPCError(reply.error, options);
};

const bindReply =
  <Input, Output, Code extends string, Procedure>(
    builder: ProcedureBuilder<Input, Output, Code, Procedure>,
  ) =>
  (reply: ReplyHandler<Input, Output, Code> | undefined) =>
    reply === undefined
      ? undefined
      : builder.handler(async ({ input, errors }) =>
          unwrapReply(await reply(input), errors),
        );

type FakeContext = {
  /** 呼ばれた procedure が入力を検証する前に返す応答。 */
  readonly replyBeforeInput: (path: string) => EarlyReply<unknown, string>;
};

const api = implement(contract, {
  initialOutputValidationIndex: -1,
}).$context<FakeContext>();
const sendEarlyReply: Middleware<
  FakeContext,
  object,
  unknown,
  unknown,
  Record<string, ErrorFactory>,
  Record<string, unknown>
> = async ({ context, errors, next, path }) => {
  const reply = context.replyBeforeInput(path.join("/"));

  return reply === undefined
    ? next()
    : { output: unwrapReply(await reply, errors), context: {} };
};

const deployTokens = api.admin.deployTokens.use(sendEarlyReply);
const passkeys = api.admin.passkeys.use(sendEarlyReply);
const session = api.admin.session.use(sendEarlyReply);

const procedures = {
  "admin/deployTokens/issue": bindReply(deployTokens.issue),
  "admin/deployTokens/list": bindReply(deployTokens.list),
  "admin/deployTokens/revoke": bindReply(deployTokens.revoke),
  "admin/passkeys/delete": bindReply(passkeys.delete),
  "admin/passkeys/list": bindReply(passkeys.list),
  "admin/passkeys/register": bindReply(passkeys.register),
  "admin/passkeys/registrationOptions": bindReply(passkeys.registrationOptions),
  "admin/passkeys/rename": bindReply(passkeys.rename),
  "admin/session/get": bindReply(session.get),
  "admin/session/logOut": bindReply(session.logOut),
  "admin/session/logOutAll": bindReply(session.logOutAll),
  "admin/session/reauthenticationOptions": bindReply(
    session.reauthenticationOptions,
  ),
  "auth/enrollment/options": bindReply(api.auth.enrollment.options),
  "auth/enrollment/register": bindReply(api.auth.enrollment.register),
  "auth/login/options": bindReply(api.auth.login.options),
  "auth/login/verify": bindReply(api.auth.login.verify),
};

type RoutePath = keyof typeof procedures;
type FakeProcedure = NonNullable<ReturnType<(typeof procedures)[RoutePath]>>;

/** 作り物の server が返す procedure ごとの応答。 */
export type FakeRoutes = {
  readonly [Path in RoutePath]?: Parameters<(typeof procedures)[Path]>[0];
};

/** 作り物の server の procedure が受け取る入力。 */
export type FakeInput<Path extends RoutePath> = Parameters<
  NonNullable<FakeRoutes[Path]>
>[0];

/** 作り物の server の procedure が返す応答。 */
export type FakeReply<Path extends RoutePath> = Awaited<
  ReturnType<NonNullable<FakeRoutes[Path]>>
>;

/** 作り物の server の procedure が返す成功の出力。 */
export type FakeOutput<Path extends RoutePath> = Extract<
  FakeReply<Path>,
  Record<"output", unknown>
>["output"];

const mount: {
  [Path in RoutePath]: (reply: FakeRoutes[Path]) => FakeProcedure | undefined;
} = procedures;

const mountProcedure = <Path extends RoutePath>(
  path: Path,
  routes: Pick<FakeRoutes, Path>,
): FakeProcedure | undefined => mount[path](routes[path]);

const isRoutePath = (path: string): path is RoutePath =>
  Object.hasOwn(procedures, path);

type FakeRouter = Record<string, Record<string, Record<string, FakeProcedure>>>;

/** テストや story が応答を決めた procedure だけを router に入れる。 */
const createFakeRouter = (routes: FakeRoutes) => {
  const router: FakeRouter = {};

  for (const path of Object.keys(routes)) {
    if (!isRoutePath(path)) {
      continue;
    }

    const [access, group, name] = path.split("/");
    const procedure = mountProcedure(path, routes);

    if (
      procedure !== undefined &&
      access !== undefined &&
      group !== undefined &&
      name !== undefined
    ) {
      ((router[access] ??= {})[group] ??= {})[name] = procedure;
    }
  }

  return router;
};

/** 作り物の server と、それにつないだ client。 */
export type FakeApi = {
  /** 作り物の server につないだ client。 */
  readonly api: ApiClient;
  /** 呼ばれた procedure のパスの並び。 */
  readonly calls: readonly string[];
  /** 作り物の server に送る fetch(client を作り直すときに使う)。 */
  readonly fetch: ApiClientOptions["fetch"];
};

/** procedure ごとの応答を決めた、作り物の server につないだ client を作る。 */
export const createFakeApi = (routes: FakeRoutes): FakeApi => {
  const handler = new RPCHandler(createFakeRouter(routes));
  const calls: string[] = [];
  const replyBeforeInput = (path: string) =>
    isRoutePath(path) ? routes[path]?.replyBeforeInput?.() : undefined;
  const fetch: ApiClientOptions["fetch"] = async (request) => {
    calls.push(new URL(request.url).pathname.replace(/^\/api\//v, ""));

    const result = await handler.handle(request, {
      prefix: "/api",
      context: { replyBeforeInput },
    });

    return result.matched
      ? result.response
      : new Response("Not Found", {
          status: 404,
          headers: { "Content-Type": "text/plain; charset=UTF-8" },
        });
  };

  return {
    api: createApiClient({ origin: "http://localhost:5173", fetch }),
    calls,
    fetch,
  };
};
