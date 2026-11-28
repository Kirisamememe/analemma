import { ORPCError, implement } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";

import { contract } from "@analemma/contract";

import type { ApiClient, UploadProgressCallback } from "@/api/api-types";
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
      /** 失敗に添える値(contract が失敗ごとに決める形)。 */
      readonly data?: unknown;
    }
  | {
      /** contract に定義していない失敗の code。 */
      readonly error: "INTERNAL_SERVER_ERROR" | "SERVICE_UNAVAILABLE";
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

type ErrorStatus = {
  /** 失敗の HTTP のステータス。 */
  readonly status?: number | undefined;
};

type ErrorStatuses<Code extends string> = Readonly<
  Record<Code, ErrorStatus | undefined>
>;

type HandlerOptions<Input> = {
  /** procedure の入力。 */
  readonly input: Input;
};

type ProcedureBuilder<Input, Output, Code extends string, Procedure> = {
  /** contract の定義。 */
  readonly "~orpc": {
    /** contract に定義した失敗。 */
    readonly errorMap: ErrorStatuses<Code>;
  };
  /** handler から procedure を作る関数。 */
  readonly handler: (
    handle: (options: HandlerOptions<Input>) => Promise<Output>,
  ) => Procedure;
};

const unwrapReply = <Output, Code extends string>(
  reply: Reply<Output, Code>,
  errorMap: Partial<ErrorStatuses<Code>>,
): Output => {
  if ("output" in reply) {
    return reply.output;
  }

  const message = reply.error;

  if (reply.defined === false) {
    throw new ORPCError(reply.error, { message });
  }

  const defined = errorMap[reply.error];

  throw new ORPCError(reply.error, {
    message,
    defined: defined !== undefined,
    ...(defined?.status === undefined ? {} : { status: defined.status }),
    data: reply.data,
  });
};

const bindReply =
  <Input, Output, Code extends string, Procedure>(
    builder: ProcedureBuilder<Input, Output, Code, Procedure>,
  ) =>
  (reply: ReplyHandler<Input, Output, Code> | undefined) =>
    reply === undefined
      ? undefined
      : builder.handler(async ({ input }) =>
          unwrapReply(await reply(input), builder["~orpc"].errorMap),
        );

type FakeContext = {
  /** 呼ばれた procedure が入力を検証する前に返す応答。 */
  readonly replyBeforeInput: (path: string) => EarlyReply<unknown, string>;
};

const api = implement(contract, {
  initialOutputValidationIndex: -1,
}).$context<FakeContext>();

const sendEarlyReply = api.middleware(
  async ({ context, next, path, procedure }) => {
    const reply = context.replyBeforeInput(path.join("/"));

    return reply === undefined
      ? next()
      : {
          output: unwrapReply(await reply, procedure["~orpc"].errorMap),
          context: {},
        };
  },
);

const deployTokens = api.admin.deployTokens.use(sendEarlyReply);
const fixedPages = api.admin.fixedPages.use(sendEarlyReply);
const images = api.admin.images.use(sendEarlyReply);
const kinds = api.admin.kinds.use(sendEarlyReply);
const passkeys = api.admin.passkeys.use(sendEarlyReply);
const session = api.admin.session.use(sendEarlyReply);

const procedures = {
  "admin/deployTokens/issue": bindReply(deployTokens.issue),
  "admin/deployTokens/list": bindReply(deployTokens.list),
  "admin/deployTokens/revoke": bindReply(deployTokens.revoke),
  "admin/fixedPages/create": bindReply(fixedPages.create),
  "admin/fixedPages/delete": bindReply(fixedPages.delete),
  "admin/fixedPages/get": bindReply(fixedPages.get),
  "admin/fixedPages/list": bindReply(fixedPages.list),
  "admin/fixedPages/publish": bindReply(fixedPages.publish),
  "admin/fixedPages/reorder": bindReply(fixedPages.reorder),
  "admin/fixedPages/unpublish": bindReply(fixedPages.unpublish),
  "admin/fixedPages/update": bindReply(fixedPages.update),
  "admin/images/delete": bindReply(images.delete),
  "admin/images/get": bindReply(images.get),
  "admin/images/list": bindReply(images.list),
  "admin/images/neighbors": bindReply(images.neighbors),
  "admin/images/publish": bindReply(images.publish),
  "admin/images/unpublish": bindReply(images.unpublish),
  "admin/images/update": bindReply(images.update),
  "admin/images/upload": bindReply(images.upload),
  "admin/kinds/get": bindReply(kinds.get),
  "admin/kinds/list": bindReply(kinds.list),
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

type Href = keyof typeof procedures;
type FakeProcedure = NonNullable<ReturnType<(typeof procedures)[Href]>>;

/** 作り物の server が返す procedure ごとの応答。 */
export type FakeRoutes = {
  readonly [Path in Href]?: Parameters<(typeof procedures)[Path]>[0];
};

/** 作り物の server の procedure が受け取る入力。 */
export type FakeInput<Path extends Href> = Parameters<
  NonNullable<FakeRoutes[Path]>
>[0];

/** 作り物の server の procedure が返す応答。 */
export type FakeReply<Path extends Href> = Awaited<
  ReturnType<NonNullable<FakeRoutes[Path]>>
>;

/** 作り物の server の procedure が返す成功の出力。 */
export type FakeOutput<Path extends Href> = Extract<
  FakeReply<Path>,
  Record<"output", unknown>
>["output"];

const mount: {
  [Path in Href]: (reply: FakeRoutes[Path]) => FakeProcedure | undefined;
} = procedures;

const mountProcedure = <Path extends Href>(
  path: Path,
  routes: Pick<FakeRoutes, Path>,
): FakeProcedure | undefined => mount[path](routes[path]);

const isHref = (path: string): path is Href => Object.hasOwn(procedures, path);

type FakeRouter = Record<string, Record<string, Record<string, FakeProcedure>>>;

/** テストや story が応答を決めた procedure だけを router に入れる。 */
const createFakeRouter = (routes: FakeRoutes) => {
  const router: FakeRouter = {};

  for (const path of Object.keys(routes)) {
    if (!isHref(path)) {
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

/** 作り物の送信が進むごとに割合を通知する関数。 */
export type FakeUploadProgress = (
  report: UploadProgressCallback,
) => void | Promise<void>;

/** procedure ごとの応答を決めた、作り物の server につないだ client を作る。 */
export const createFakeApi = (
  routes: FakeRoutes,
  uploadProgress?: FakeUploadProgress,
): FakeApi => {
  const handler = new RPCHandler(createFakeRouter(routes));
  const calls: string[] = [];

  const replyBeforeInput = (path: string) =>
    isHref(path) ? routes[path]?.replyBeforeInput?.() : undefined;

  const fetch: ApiClientOptions["fetch"] = async (request, init) => {
    calls.push(new URL(request.url).pathname.replace(/^\/api\//v, ""));

    if (init.upload && uploadProgress) await uploadProgress(init.upload.report);

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
