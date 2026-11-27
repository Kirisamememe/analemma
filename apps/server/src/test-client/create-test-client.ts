import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { RouterClient } from "@orpc/server";
import type { Hono } from "hono";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  createExternalApp,
  createInternalApp,
  type externalRouter,
  type internalRouter,
} from "@/app";
import type { AppContext } from "@/context";
import {
  CHALLENGE_CAPACITY,
  CHALLENGE_LIFETIME_MS,
  createChallengeStore,
} from "@/features/auth/challenge/create-challenge-store";
import { issueEnrollment } from "@/features/auth/enrollment/issue-enrollment";
import { createDropboxContext } from "@/features/dropbox/dropbox-context";
import {
  type PendingPhotos,
  createPendingPhotos,
} from "@/features/images/creating/pending-photos";
import { resumePendingImages } from "@/features/images/creating/resume-pending-images";
import {
  type ConversionQueue,
  createConversionQueue,
} from "@/features/images/processing/conversion-queue";
import type { Clock } from "@/platform/clock";
import { createDropboxApi } from "@/platform/dropbox/create-dropbox-api";
import {
  type FileStorage,
  openFileStorage,
} from "@/platform/file-storage/open-file-storage";
import type { LogEntry, Logger } from "@/platform/logger";
import { createTestDatabase } from "@/platform/test-database/create-test-database";
import { createCookieJar } from "@/test-client/create-cookie-jar";
import {
  createFakeDropbox,
  type FakeDropbox,
  TEST_DROPBOX_APP,
} from "@/test-client/create-fake-dropbox";

/** テストで差し替える依存と、最初から持たせる Cookie。 */
export type TestClientOptions = {
  /** 現在時刻の出どころ。 */
  readonly clock?: Clock;
  /** 最初のブラウザに持たせる Cookie ヘッダーの値。 */
  readonly cookie?: string;
  /** 写真の変換を1つずつ流すキュー。 */
  readonly conversions?: ConversionQueue;
  /** Dropbox のアプリの設定が無い server にするか。 */
  readonly withoutDropbox?: boolean;
  /** 新しい写真を受け取らなくなる、置いてある原本の合計(bytes)。 */
  readonly pendingLimit?: number;
};

/** それぞれ自分の Cookie を持つ、テストのブラウザ。 */
export type TestBrowser = {
  /** 外部用のポートのアプリにつないだ、型付きの client。 */
  readonly client: RouterClient<typeof externalRouter>;
  /** 持っている Cookie を、Cookie ヘッダーの形で返す。 */
  readonly cookie: () => string;
};

/** テストのために組み立てたアプリと、それにつないだ client。 */
export type TestClient = AsyncDisposable &
  TestBrowser & {
    /** テストのために組み立てた、外部用のポートのアプリ。 */
    readonly app: Hono;
    /** テストのために組み立てた、内部用のポートのアプリ。 */
    readonly internalApp: Hono;
    /** 内部用のポートのアプリにつないだ client を、Authorization の token を添えて作る。 */
    readonly internal: (token?: string) => RouterClient<typeof internalRouter>;
    /** アプリが書き出したログ。 */
    readonly logs: readonly LogEntry[];
    /** アプリがつないでいる、テストの DB の名前。 */
    readonly databaseName: string;
    /** アプリが使う、テストだけの配信用の画像の置き場所。 */
    readonly storage: FileStorage;
    /** アプリがつなぐ、作り物の Dropbox。 */
    readonly dropbox: FakeDropbox;
    /** 変換を待つ原本の置き場所と、リクエストの外で進める変換の見張り。 */
    readonly pending: PendingPhotos;
    /** server を止めるときと同じに、新しい変換を始めさせず、進めている変換を待つ。 */
    readonly stop: () => Promise<void>;
    /** 起動し直したときと同じに、変換を待つ画像を拾い直す。 */
    readonly resume: () => Promise<void>;
    /** 同じアプリにつないだ、別のブラウザを開く。 */
    readonly openBrowser: (cookie?: string) => TestBrowser;
    /** コマンドと同じやり方で、1回きりの登録用 URL を出す。 */
    readonly issueEnrollmentUrl: () => Promise<string>;
  };

/** テストの中の現在時刻。 */
export const TEST_NOW = new Date("2026-01-01T00:00:00.000Z");

/** テストの管理画面の origin。 */
export const TEST_ORIGIN = "https://analemma.test";

/** テストの内部用のポートの URL。 */
export const TEST_INTERNAL_URL = "http://127.0.0.1:8788";

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
  const mediaDirectory = await mkdtemp(join(tmpdir(), "analemma-media-"));

  stack.defer(async () => {
    await rm(mediaDirectory, { recursive: true, force: true });
  });

  const storage = await openFileStorage(mediaDirectory);
  const dropbox = createFakeDropbox();

  const context: { -readonly [Key in keyof AppContext]: AppContext[Key] } = {
    clock,
    db: database.db,
    logger,
    relyingParty: { origin: TEST_ORIGIN, rpId: TEST_RP_ID },
    storage,
    challenges: createChallengeStore({
      capacity: CHALLENGE_CAPACITY,
      lifetimeMs: CHALLENGE_LIFETIME_MS,
    }),
    conversions: options.conversions ?? createConversionQueue(),
    pending: createPendingPhotos(storage, options.pendingLimit),
    dropbox: createDropboxContext(
      options.withoutDropbox === true
        ? undefined
        : createDropboxApi(TEST_DROPBOX_APP, dropbox.fetch),
    ),
  };

  stack.defer(async () => {
    await context.dropbox.imports.stop();
  });

  stack.defer(async () => {
    await context.pending.stop();
  });

  const app = createExternalApp(context);
  const internalApp = createInternalApp(context);

  const openBrowser = (seed = ""): TestBrowser => {
    const jar = createCookieJar(seed);

    const link = new RPCLink({
      url: `${TEST_ORIGIN}/api`,
      headers: () =>
        jar.header() === ""
          ? { origin: TEST_ORIGIN, "sec-fetch-site": "same-origin" }
          : {
              origin: TEST_ORIGIN,
              "sec-fetch-site": "same-origin",
              cookie: jar.header(),
            },
      fetch: async (request) => {
        const response = await app.fetch(request);

        jar.store(response.headers.getSetCookie());

        return response;
      },
    });

    return {
      client: createORPCClient<RouterClient<typeof externalRouter>>(link),
      cookie: jar.header,
    };
  };

  const internal = (token?: string): RouterClient<typeof internalRouter> =>
    createORPCClient(
      new RPCLink({
        url: `${TEST_INTERNAL_URL}/api`,
        headers:
          token === undefined ? {} : { authorization: `Bearer ${token}` },
        fetch: async (request) => internalApp.fetch(request),
      }),
    );

  const browser = openBrowser(options.cookie);
  const resources = stack.move();

  return {
    ...browser,
    app,
    internalApp,
    internal,
    logs,
    databaseName: database.name,
    storage,
    dropbox,
    get pending() {
      return context.pending;
    },
    stop: async () => {
      await context.pending.stop();
    },
    resume: async () => {
      context.pending = createPendingPhotos(storage, options.pendingLimit);
      await resumePendingImages(context);
    },
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
