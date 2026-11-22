import { ORPCError, implement } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";

import { contract } from "@analemma/contract";

import type { ApiClient } from "../api/api-types";
import {
  type ApiClientOptions,
  createApiClient,
} from "../api/create-api-client";

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

type ReplyHandler<Input, Output, Code extends string> = (
  input: Input,
) => Reply<Output, Code> | Promise<Reply<Output, Code>>;

type HandlerOptions<Input, Code extends string> = {
  /** procedure の入力。 */
  readonly input: Input;
  /** contract に定義した失敗を作る関数。 */
  readonly errors: Record<Code, (options: Pick<Error, "message">) => Error>;
};

type ProcedureBuilder<Input, Output, Code extends string, Procedure> = {
  /** handler から procedure を作る関数。 */
  readonly handler: (
    handle: (options: HandlerOptions<Input, Code>) => Promise<Output>,
  ) => Procedure;
};

const bindReply =
  <Input, Output, Code extends string, Procedure>(
    builder: ProcedureBuilder<Input, Output, Code, Procedure>,
  ) =>
  (reply: ReplyHandler<Input, Output, Code> | undefined) =>
    reply === undefined
      ? undefined
      : builder.handler(async ({ input, errors }) => {
          const result = await reply(input);

          if ("output" in result) {
            return result.output;
          }

          if (result.defined === false) {
            throw new ORPCError(result.error, { message: result.error });
          }

          throw errors[result.error]({ message: result.error });
        });

const api = implement(contract);

const procedures = {
  "admin/passkeys/delete": bindReply(api.admin.passkeys.delete),
  "admin/passkeys/list": bindReply(api.admin.passkeys.list),
  "admin/passkeys/register": bindReply(api.admin.passkeys.register),
  "admin/passkeys/registrationOptions": bindReply(
    api.admin.passkeys.registrationOptions,
  ),
  "admin/passkeys/rename": bindReply(api.admin.passkeys.rename),
  "admin/session/get": bindReply(api.admin.session.get),
  "admin/session/logOut": bindReply(api.admin.session.logOut),
  "admin/session/logOutAll": bindReply(api.admin.session.logOutAll),
  "admin/session/reauthenticationOptions": bindReply(
    api.admin.session.reauthenticationOptions,
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
  const fetch: ApiClientOptions["fetch"] = async (request) => {
    calls.push(new URL(request.url).pathname.replace(/^\/api\//v, ""));

    const result = await handler.handle(request, {
      prefix: "/api",
      context: {},
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
