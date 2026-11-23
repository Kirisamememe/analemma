import { describe, expect, test } from "bun:test";

import { PHOTO_MAX_BYTES } from "@analemma/contract";

import {
  type ConversionQueue,
  createConversionQueue,
} from "@/features/images/processing/conversion-queue";
import { detectImageFormat } from "@/platform/images/detect-image-format";
import {
  catchErrorCode,
  createTestClient,
  SUCCEEDED,
  signInAsAdmin,
  TEST_NOW,
  TEST_ORIGIN,
  type TestClient,
} from "@/test-client";

const FIXTURES = {
  "wide-red.jpg": "../../processing/__tests__/wide-red.jpg",
  "high-iso.jpg": "../../processing/__tests__/high-iso.jpg",
  "red.bmp": "../../processing/__tests__/red.bmp",
  "rotated-with-gps.heic":
    "../../../../platform/images/__tests__/rotated-with-gps.heic",
};

const photo = async (name: keyof typeof FIXTURES, type = "") => {
  const response = await fetch(new URL(FIXTURES[name], import.meta.url));

  return new File([await response.arrayBuffer()], name, { type });
};

const MEGABYTE = 1024 * 1024;

/** テストで送る、写真の本文の大きさと Cookie。 */
type UploadBody = {
  /** 本文の bytes の数。 */
  readonly size: number;
  /** Content-Length に書く値。 */
  readonly contentLength?: number;
  /** ログインしたブラウザの Cookie を付けるか。 */
  readonly cookie: boolean;
  /** `/api/admin/` の後ろのパス。 */
  readonly path?: string;
};

const uploadRequest = (
  server: TestClient,
  { size, contentLength = size, cookie, path = "images/upload" }: UploadBody,
): Request =>
  new Request(`${TEST_ORIGIN}/api/admin/${path}`, {
    method: "POST",
    headers: {
      origin: TEST_ORIGIN,
      "sec-fetch-site": "same-origin",
      "content-type": "multipart/form-data; boundary=photo",
      "content-length": String(contentLength),
      ...(cookie && { cookie: server.cookie() }),
    },
    body: new Uint8Array(size),
  });

/** 送った写真の数が届くのを待つ、テストの関数。 */
type QueuedWaiter = {
  /** 待つ数。 */
  readonly count: number;
  /** 届いたら呼ぶ関数。 */
  readonly resolve: () => void;
};

const holdFirstConversion = () => {
  const queue = createConversionQueue();
  const gate = Promise.withResolvers<undefined>();
  const waiters: QueuedWaiter[] = [];
  let queued = 0;
  let converted = 0;

  const conversions: ConversionQueue = {
    run: async <T>(
      convert: () => Promise<T>,
      signal?: AbortSignal,
    ): Promise<T> => {
      queued += 1;
      const order = queued;

      for (const waiter of waiters.filter(({ count }) => count <= queued)) {
        waiter.resolve();
      }

      return queue.run(async () => {
        if (order === 1) await gate.promise;

        converted += 1;

        return convert();
      }, signal);
    },
  };

  return {
    conversions,
    queued: async (count: number): Promise<void> => {
      if (queued >= count) return;

      const { promise, resolve } = Promise.withResolvers<undefined>();
      waiters.push({
        count,
        resolve: () => {
          resolve(undefined);
        },
      });
      await promise;
    },
    release: () => {
      gate.resolve(undefined);
    },
    converted: () => converted,
  };
};

describe("写真を送って画像を作る", () => {
  test("JPEG から、撮影の情報と配信用の画像を持つ公開の画像を作り、一覧の先頭に出すこと", async () => {
    await using server = await createTestClient();
    await signInAsAdmin(server);

    const image = await server.client.admin.images.upload({
      photo: await photo("high-iso.jpg", "image/jpeg"),
    });

    expect(image).toMatchObject({
      title: null,
      description: null,
      alt: null,
      iso: 102_400,
      published: true,
      publishedAt: TEST_NOW.toISOString(),
    });
    expect((await server.client.admin.images.list({})).images).toEqual([image]);
  });

  test("幅の段ごとの AVIF を作り、配信すること", async () => {
    await using server = await createTestClient();
    await signInAsAdmin(server);

    const image = await server.client.admin.images.upload({
      photo: await photo("wide-red.jpg", "image/jpeg"),
    });

    expect(image.deliveryImages.map(({ width }) => width)).toEqual([
      640, 1280, 1920, 2560,
    ]);

    const formats = await Promise.all(
      image.deliveryImages.map(async ({ url }) => {
        const response = await server.app.request(url);
        expect(response.status).toBe(200);

        return detectImageFormat(new Uint8Array(await response.arrayBuffer()));
      }),
    );

    expect(formats).toEqual(["avif", "avif", "avif", "avif"]);
  });

  test("HEIC を、MIME type が空でも中身で見分け、表示の向きの大きさで登録すること", async () => {
    await using server = await createTestClient();
    await signInAsAdmin(server);

    const image = await server.client.admin.images.upload({
      photo: await photo("rotated-with-gps.heic"),
    });

    expect(image).toMatchObject({
      takenAt: "2025-05-01T14:03:27",
      takenAtOffset: "+09:00",
      deliveryImages: [{ width: 64, height: 96 }],
    });
  });

  test("受けない形式の写真は UNSUPPORTED_FORMAT で断り、画像を作らないこと", async () => {
    await using server = await createTestClient();
    await signInAsAdmin(server);

    expect(
      await catchErrorCode(
        server.client.admin.images.upload({
          photo: await photo("red.bmp", "image/jpeg"),
        }),
      ),
    ).toBe("UNSUPPORTED_FORMAT");
    expect((await server.client.admin.images.list({})).images).toEqual([]);
  });

  test("同時に送った2枚の写真を、1枚ずつ変換して、どちらも画像にすること", async () => {
    const queue = createConversionQueue();
    const steps: string[] = [];

    const conversions: ConversionQueue = {
      run: async <T>(convert: () => Promise<T>): Promise<T> =>
        queue.run(async () => {
          const order = steps.filter((step) => step.endsWith("始めた")).length;
          steps.push(`${String(order + 1)} を始めた`);
          const result = await convert();
          steps.push(`${String(order + 1)} を終えた`);

          return result;
        }),
    };

    await using server = await createTestClient({ conversions });
    await signInAsAdmin(server);

    const images = await Promise.all([
      server.client.admin.images.upload({
        photo: await photo("high-iso.jpg"),
      }),
      server.client.admin.images.upload({
        photo: await photo("rotated-with-gps.heic"),
      }),
    ]);

    expect(steps).toEqual([
      "1 を始めた",
      "1 を終えた",
      "2 を始めた",
      "2 を終えた",
    ]);

    const listed = (await server.client.admin.images.list({})).images;

    expect(listed.map(({ id }) => id).toSorted()).toEqual(
      images.map(({ id }) => id).toSorted(),
    );
  });

  test("ログイン中でも、3枚目を同時に送ると、末尾の / の有無によらず本文を読まずに 503 で断り、空いたら受けること", async () => {
    const held = holdFirstConversion();
    await using server = await createTestClient({
      conversions: held.conversions,
    });
    await signInAsAdmin(server);

    const upload = async () =>
      catchErrorCode(
        server.client.admin.images.upload({
          photo: await photo("high-iso.jpg"),
        }),
      );

    const first = [upload(), upload()];
    await held.queued(2);

    expect(await upload()).toBe("SERVICE_UNAVAILABLE");

    for (const path of ["images/upload", "images/upload/"]) {
      const request = uploadRequest(server, { size: 16, cookie: true, path });
      const response = await server.app.fetch(request);

      expect(response.status).toBe(503);
      expect(response.headers.get("retry-after")).toBe("10");
      expect(request.bodyUsed).toBe(false);
    }

    held.release();

    expect(await Promise.all(first)).toEqual([SUCCEEDED, SUCCEEDED]);
    expect(await upload()).toBe(SUCCEEDED);
  });

  test("変換を待つ間に送るのをやめた写真は、画像にせず、枠を空けて、ログに失敗と書かないこと", async () => {
    const held = holdFirstConversion();
    await using server = await createTestClient({
      conversions: held.conversions,
    });
    await signInAsAdmin(server);

    const first = server.client.admin.images.upload({
      photo: await photo("high-iso.jpg"),
    });

    const controller = new AbortController();

    const abandoned = server.client.admin.images.upload(
      { photo: await photo("wide-red.jpg") },
      { signal: controller.signal },
    );

    await held.queued(2);
    controller.abort();
    await Promise.allSettled([abandoned]);

    const next = server.client.admin.images.upload({
      photo: await photo("rotated-with-gps.heic"),
    });

    held.release();

    const images = await Promise.all([first, next]);
    const listed = (await server.client.admin.images.list({})).images;

    expect(listed.map(({ id }) => id).toSorted()).toEqual(
      images.map(({ id }) => id).toSorted(),
    );
    expect(held.converted()).toBe(2);
    expect(server.logs.filter(({ level }) => level === "error")).toEqual([]);
  });

  test("ログイン中に送った写真だけ、変換を待つ間の接続を長く保たせること", async () => {
    const kept: string[] = [];

    await using server = await createTestClient({
      listener: {
        keepAlive: (request) => {
          kept.push(new URL(request.url).pathname);
        },
      },
    });

    await server.app.fetch(uploadRequest(server, { size: 16, cookie: false }));
    expect(kept).toEqual([]);

    await signInAsAdmin(server);
    await server.client.admin.images.upload({
      photo: await photo("high-iso.jpg"),
    });

    expect(kept).toEqual(["/api/admin/images/upload"]);
  });
});

describe("写真を送る本文の大きさ", () => {
  test("セッションが無いと、ほかの API と同じ 1 MB を超える本文を 413 で断ること", async () => {
    await using server = await createTestClient();

    const response = await server.app.fetch(
      uploadRequest(server, { size: 2 * MEGABYTE, cookie: false }),
    );

    expect(response.status).toBe(413);
  });

  test("ログイン中なら 1 MB を超える写真も受け、中身の形式を確かめること", async () => {
    await using server = await createTestClient();
    await signInAsAdmin(server);

    const large = new File([new Uint8Array(2 * MEGABYTE)], "large.jpg");

    expect(
      await catchErrorCode(server.client.admin.images.upload({ photo: large })),
    ).toBe("UNSUPPORTED_FORMAT");
  });

  test("ログイン中でも、写真を送る procedure のほかには、ファイルを含む本文にも 1 MB の上限を掛けること", async () => {
    await using server = await createTestClient();
    await signInAsAdmin(server);

    const response = await server.app.fetch(
      uploadRequest(server, {
        size: 2 * MEGABYTE,
        cookie: true,
        path: "fixedPages/update",
      }),
    );

    expect(response.status).toBe(413);
  });

  test("ログイン中でも、写真の上限にほかの API の上限を足した大きさを超える本文は、読まずに 413 で断ること", async () => {
    await using server = await createTestClient();
    await signInAsAdmin(server);

    const response = await server.app.fetch(
      uploadRequest(server, {
        size: 16,
        contentLength: PHOTO_MAX_BYTES + MEGABYTE + 1,
        cookie: true,
      }),
    );

    expect(response.status).toBe(413);
  });

  test("本文の上限を決めるためのセッションの確認に失敗したら、500 にしてログに書くこと", async () => {
    let failing = false;

    await using server = await createTestClient({
      clock: {
        now: () => {
          if (failing) throw new Error("時刻を読めない");

          return TEST_NOW;
        },
      },
    });
    await signInAsAdmin(server);
    failing = true;

    const response = await server.app.fetch(
      uploadRequest(server, { size: 16, cookie: true }),
    );

    expect(response.status).toBe(500);
    expect(server.logs.at(-1)).toMatchObject({
      level: "error",
      message: "HTTP の処理で想定外の失敗が起きた",
    });
  });
});
