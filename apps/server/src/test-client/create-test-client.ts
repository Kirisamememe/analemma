import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { RouterClient } from "@orpc/server";
import type { Hono } from "hono";

import { createApp } from "../app";
import {
  CHALLENGE_CAPACITY,
  CHALLENGE_LIFETIME_MS,
  createChallengeStore,
} from "../features/auth/challenge/create-challenge-store";
import { issueEnrollment } from "../features/auth/enrollment/issue-enrollment";
import type { Clock } from "../platform/clock";
import type { LogEntry, Logger } from "../platform/logger";
import { createTestDatabase } from "../platform/test-database/create-test-database";
import type { router } from "../router";
import { createCookieJar } from "./create-cookie-jar";

/** テストで差し替える依存と、最初から持たせる Cookie。 */
export type TestClientOptions = {
  /** 現在時刻の出どころ。 */
  readonly clock?: Clock;
  /** 最初のブラウザに持たせる Cookie ヘッダーの値。 */
  readonly cookie?: string;
};

/** それぞれ自分の Cookie を持つ、テストのブラウザ。 */
export type TestBrowser = {
  /** アプリにつないだ、型付きの client。 */
  readonly client: RouterClient<typeof router>;
  /** 持っている Cookie を、Cookie ヘッダーの形で返す。 */
  readonly cookie: () => string;
};

/** テストのために組み立てたアプリと、それにつないだ client。 */
export type TestClient = AsyncDisposable &
  TestBrowser & {
    /** テストのために組み立てたアプリ。 */
    readonly app: Hono;
    /** アプリが書き出したログ。 */
    readonly logs: readonly LogEntry[];
    /** アプリがつないでいる、テストの DB の名前。 */
    readonly databaseName: string;
    /** 同じアプリにつないだ、別のブラウザを開く。 */
    readonly openBrowser: (cookie?: string) => TestBrowser;
    /** コマンドと同じやり方で、1回きりの登録用 URL を出す。 */
    readonly issueEnrollmentUrl: () => Promise<string>;
  };

/** テストの中の現在時刻。 */
export const TEST_NOW = new Date("2026-01-01T00:00:00.000Z");

/** テストの管理画面の origin。 */
export const TEST_ORIGIN = "https://analemma.test";

/** テストの RP ID。 */
export const TEST_RP_ID = "analemma.test";

/** API 越しのテストに使う、アプリとそれにつないだ client を、テストだけの DB で作る。 */
export const createTestClient = async (
  options: TestClientOptions = {},
): Promise<TestClient> => {
  await using stack = new AsyncDisposableStack();
  const logs: LogEntry[] = [];
  const logger: Logger = {
    write: (entry) => {
      logs.push(entry);
    },
  };
  const clock = options.clock ?? { now: () => TEST_NOW };
  const database = stack.use(await createTestDatabase({ logger }));
  const app = createApp({
    clock,
    db: database.db,
    logger,
    relyingParty: { origin: TEST_ORIGIN, rpId: TEST_RP_ID },
    challenges: createChallengeStore({
      capacity: CHALLENGE_CAPACITY,
      lifetimeMs: CHALLENGE_LIFETIME_MS,
    }),
  });

  const openBrowser = (seed = ""): TestBrowser => {
    const jar = createCookieJar(seed);
    const link = new RPCLink({
      url: `${TEST_ORIGIN}/api`,
      headers: () =>
        jar.header() === ""
          ? { origin: TEST_ORIGIN }
          : { origin: TEST_ORIGIN, cookie: jar.header() },
      fetch: async (request) => {
        const response = await app.fetch(request);

        jar.store(response.headers.getSetCookie());

        return response;
      },
    });

    return {
      client: createORPCClient<RouterClient<typeof router>>(link),
      cookie: jar.header,
    };
  };

  const browser = openBrowser(options.cookie);
  const resources = stack.move();

  return {
    ...browser,
    app,
    logs,
    databaseName: database.name,
    openBrowser,
    issueEnrollmentUrl: async () =>
      (
        await issueEnrollment({
          db: database.db,
          origin: TEST_ORIGIN,
          now: clock.now(),
        })
      ).url,
    [Symbol.asyncDispose]: () => resources.disposeAsync(),
  };
};
