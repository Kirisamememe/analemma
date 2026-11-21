import type { ApiClient } from "../api/api-types";
import { createApiClient } from "../api/create-api-client";

/** 作り物の server が返す、成功。 */
type FakeOutput = {
  /** procedure の出力。 */
  readonly output: unknown;
};

/** 作り物の server が返す、contract に定義した失敗。 */
type FakeError = {
  /** 失敗の code。 */
  readonly error: string;
  /** HTTP のステータス。 */
  readonly status: number;
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
            defined: true,
            code: reply.error,
            status: reply.status,
            message: reply.error,
          },
        },
        { status: reply.status },
      );

/** procedure ごとの応答を決めた、作り物の server につないだ client を作る。 */
export const createFakeApi = (routes: FakeRoutes): FakeApi => {
  const calls: string[] = [];
  const api = createApiClient({
    origin: "http://localhost:5173",
    fetch: async (request) => {
      const path = new URL(request.url).pathname.replace(/^\/api\//v, "");
      const route = routes[path];

      calls.push(path);

      return toResponse(
        route === undefined
          ? { error: "NOT_FOUND", status: 404 }
          : route(await readInput(request)),
      );
    },
  });

  return { api, calls };
};
