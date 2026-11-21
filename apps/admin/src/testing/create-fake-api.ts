import type { ApiClient } from "../api/api-types";
import {
  type ApiClientOptions,
  createApiClient,
} from "../api/create-api-client";

/** 作り物の server が返す、成功。 */
type FakeOutput = {
  /** procedure の出力。 */
  readonly output: unknown;
};

/** 作り物の server が返す失敗。 */
type FakeError = {
  /** 失敗の code。 */
  readonly error: string;
  /** HTTP のステータス。 */
  readonly status: number;
  /** contract に定義した失敗か(既定は true)。 */
  readonly defined?: boolean;
};

/** 作り物の server が、procedure ごとに返すもの。 */
export type FakeReply = FakeOutput | FakeError;

/** procedure のパス(`auth/login/options` など)ごとの、作り物の応答。 */
export type FakeRoutes = Readonly<
  Record<string, (input: unknown) => FakeReply>
>;

/** 作り物の server と、それにつないだ client。 */
export type FakeApi = {
  /** 作り物の server につないだ client。 */
  readonly api: ApiClient;
  /** 呼ばれた procedure のパスの並び。 */
  readonly calls: readonly string[];
  /** 作り物の server に送る fetch(client を作り直すときに使う)。 */
  readonly fetch: ApiClientOptions["fetch"];
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const readInput = async (request: Request): Promise<unknown> => {
  const text = await request.text();
  const body: unknown = text === "" ? undefined : JSON.parse(text);

  return isRecord(body) ? body["json"] : undefined;
};

const toResponse = (reply: FakeReply): Response =>
  "output" in reply
    ? Response.json({ json: reply.output })
    : Response.json(
        {
          json: {
            defined: reply.defined ?? true,
            code: reply.error,
            status: reply.status,
            message: reply.error,
          },
        },
        { status: reply.status },
      );

const NOT_FOUND = (): Response => new Response("Not Found", { status: 404 });

/** procedure ごとの応答を決めた、作り物の server につないだ client を作る。 */
export const createFakeApi = (routes: FakeRoutes): FakeApi => {
  const calls: string[] = [];
  const fetch: ApiClientOptions["fetch"] = async (request) => {
    const path = new URL(request.url).pathname.replace(/^\/api\//v, "");
    const route = routes[path];

    calls.push(path);

    return route === undefined
      ? NOT_FOUND()
      : toResponse(route(await readInput(request)));
  };

  return {
    api: createApiClient({ origin: "http://localhost:5173", fetch }),
    calls,
    fetch,
  };
};
