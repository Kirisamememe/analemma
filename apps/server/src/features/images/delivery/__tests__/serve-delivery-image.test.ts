import { describe, expect, test } from "bun:test";

import { deliveryImage } from "@/db/schema/delivery-image";
import { image } from "@/db/schema/image";
import { openDatabase } from "@/platform/database";
import { toTestDatabaseTarget } from "@/platform/test-database/to-test-database-target";
import {
  createTestClient,
  signInAsAdmin,
  TEST_NOW,
  TEST_ORIGIN,
  type TestClient,
} from "@/test-client";

/** 配信用の画像を取りに行くリクエスト。 */
type MediaRequest = {
  /** リクエストの path。 */
  readonly path: string;
  /** リクエストのヘッダー。 */
  readonly headers?: Record<string, string>;
  /** リクエストの HTTP のメソッド。 */
  readonly method?: string;
};

const BYTES = new Uint8Array([0, 0, 0, 28, 102, 116, 121, 112]);
const MISSING_ID = "019b0000-0000-7000-8000-000000000000";
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

const insertDeliveredImage = async (
  server: TestClient,
  published: boolean,
): Promise<string> => {
  await using connection = openDatabase({
    target: toTestDatabaseTarget(server.databaseName),
    logger: { write: () => undefined },
    max: 1,
  });

  const [row] = await connection.db
    .insert(image)
    .values({
      publishedAt: published ? TEST_NOW : null,
      createdAt: TEST_NOW,
      updatedAt: TEST_NOW,
    })
    .returning({ id: image.id });

  const id = row?.id ?? "";

  await connection.db.insert(deliveryImage).values({
    imageId: id,
    width: 640,
    height: 427,
    fileKey: `stored/${id}-small.avif`,
  });
  await server.storage.write(`stored/${id}-small.avif`, BYTES);

  return id;
};

const fetchMedia = async (
  server: TestClient,
  { headers = {}, method = "GET", path }: MediaRequest,
): Promise<Response> =>
  server.app.fetch(new Request(`${TEST_ORIGIN}${path}`, { method, headers }));

const summarize = async (response: Response) => ({
  status: response.status,
  cacheControl: response.headers.get("cache-control"),
  body: [...(await response.bytes())],
});

const NOT_FOUND = { status: 404, cacheControl: "no-store", body: [] };

describe("公開の画像", () => {
  test("Cookie が無くても、行にある名前のファイルを AVIF として返し、キャッシュに1時間まで残させ、ほかの origin のページにも埋め込ませること", async () => {
    await using server = await createTestClient();

    const id = await insertDeliveredImage(server, true);
    const path = `/media/${id}/640.avif`;
    const response = await fetchMedia(server, { path });

    expect(await summarize(response)).toEqual({
      status: 200,
      cacheControl: "public, max-age=3600, must-revalidate",
      body: [...BYTES],
    });
    expect(response.headers.get("content-type")).toBe("image/avif");
    expect(response.headers.get("cross-origin-resource-policy")).toBe(
      "cross-origin",
    );
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(
      await summarize(await fetchMedia(server, { path, method: "HEAD" })),
    ).toEqual({
      status: 200,
      cacheControl: "public, max-age=3600, must-revalidate",
      body: [],
    });
  });

  test("非公開にすると、セッションの無いリクエストには返さないこと", async () => {
    await using server = await createTestClient();

    await signInAsAdmin(server);

    const id = await insertDeliveredImage(server, true);
    const path = `/media/${id}/640.avif`;

    await server.client.admin.images.unpublish({ id });

    expect(await summarize(await fetchMedia(server, { path }))).toEqual(
      NOT_FOUND,
    );

    await server.client.admin.images.publish({ id });

    expect((await fetchMedia(server, { path })).status).toBe(200);
  });
});

describe("非公開の画像", () => {
  test("同じ origin か利用者が開いたリクエストで、管理者のセッションがあるときだけ、共有のキャッシュに残させずに返すこと", async () => {
    await using server = await createTestClient();

    await signInAsAdmin(server);

    const id = await insertDeliveredImage(server, false);
    const path = `/media/${id}/640.avif`;

    const fetchAs = async (headers: Record<string, string>) =>
      summarize(await fetchMedia(server, { path, headers }));

    const returned = {
      status: 200,
      cacheControl: "private, no-store",
      body: [...BYTES],
    };

    const cookie = server.cookie();

    expect(await fetchAs({ cookie, "sec-fetch-site": "same-origin" })).toEqual(
      returned,
    );
    expect(await fetchAs({ cookie, "sec-fetch-site": "none" })).toEqual(
      returned,
    );
    expect(await fetchAs({ cookie, "sec-fetch-site": "same-site" })).toEqual(
      NOT_FOUND,
    );
    expect(await fetchAs({ cookie, "sec-fetch-site": "cross-site" })).toEqual(
      NOT_FOUND,
    );
    expect(await fetchAs({ cookie })).toEqual(NOT_FOUND);
    expect(await fetchAs({ "sec-fetch-site": "same-origin" })).toEqual(
      NOT_FOUND,
    );
    expect(
      await fetchAs({
        cookie: `${cookie.split("=")[0] ?? ""}=AAAA.BBBB`,
        "sec-fetch-site": "same-origin",
      }),
    ).toEqual(NOT_FOUND);
  });

  test("返すときもセッションの期限を延ばさず、セッションが切れていれば返さないこと", async () => {
    let now = TEST_NOW;
    await using server = await createTestClient({ clock: { now: () => now } });

    await signInAsAdmin(server);

    const id = await insertDeliveredImage(server, false);

    const fetchUnpublished = async () =>
      fetchMedia(server, {
        path: `/media/${id}/640.avif`,
        headers: { cookie: server.cookie(), "sec-fetch-site": "same-origin" },
      });

    now = new Date(TEST_NOW.getTime() + 2 * HOUR);

    const refreshable = await fetchUnpublished();

    const session = await server.app.fetch(
      new Request(`${TEST_ORIGIN}/api/admin/session/get`, {
        headers: { cookie: server.cookie(), "sec-fetch-site": "same-origin" },
      }),
    );

    expect(refreshable.status).toBe(200);
    expect(refreshable.headers.getSetCookie()).toEqual([]);
    expect(session.headers.getSetCookie()).toHaveLength(1);

    now = new Date(now.getTime() + 7 * DAY);

    expect(await summarize(await fetchUnpublished())).toEqual(NOT_FOUND);
  });
});

describe("返さないリクエスト", () => {
  test("無い画像・無い幅・形の違う path は、非公開の画像と同じ 404 にし、内部用のポートでは配らないこと", async () => {
    await using server = await createTestClient();

    const id = await insertDeliveredImage(server, true);

    const paths = [
      `/media/${MISSING_ID}/640.avif`,
      `/media/${id}/1280.avif`,
      `/media/${id.toUpperCase()}/640.avif`,
      `/media/${id}/0640.avif`,
      `/media/${id}/640.webp`,
      `/media/${id}/640.avif/`,
      `/media/${id}/%36%34%30.avif`,
      `/media/${id}`,
      "/media/",
      "/media",
    ];

    const responses = await Promise.all(
      paths.map(async (path) => summarize(await fetchMedia(server, { path }))),
    );

    expect(responses).toEqual(paths.map(() => NOT_FOUND));
    expect(
      (await server.internalApp.request(`/media/${id}/640.avif`)).status,
    ).toBe(404);
  });

  test("GET と HEAD のほかのメソッドは、405 にすること", async () => {
    await using server = await createTestClient();

    const id = await insertDeliveredImage(server, true);

    const methods = ["POST", "PUT", "DELETE", "OPTIONS"];

    const responses = await Promise.all(
      methods.map(async (method) =>
        fetchMedia(server, { path: `/media/${id}/640.avif`, method }),
      ),
    );

    expect(
      responses.map((response) => [
        response.status,
        response.headers.get("allow"),
      ]),
    ).toEqual(methods.map(() => [405, "GET, HEAD"]));
  });

  test("行があってもファイルが置き場所に無ければ、404 にしてログに書くこと", async () => {
    await using server = await createTestClient();

    const id = await insertDeliveredImage(server, true);

    await server.storage.remove([`stored/${id}-small.avif`]);

    expect(
      await summarize(
        await fetchMedia(server, { path: `/media/${id}/640.avif` }),
      ),
    ).toEqual(NOT_FOUND);
    expect(server.logs).toContainEqual({
      level: "error",
      message: "配信用の画像のファイルが置き場所に無い",
      details: { imageId: id, width: 640, fileKey: `stored/${id}-small.avif` },
    });
  });
});
