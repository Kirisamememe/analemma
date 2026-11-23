import { describe, expect, test } from "bun:test";

import type { ContractInputs, ContractOutputs } from "@analemma/contract";

import { deliveryImage } from "@/db/schema/delivery-image";
import { image } from "@/db/schema/image";
import { openDatabase } from "@/platform/database";
import { toTestDatabaseTarget } from "@/platform/test-database/to-test-database-target";
import {
  SUCCEEDED,
  catchErrorCode,
  createTestClient,
  signInAsAdmin,
  TEST_NOW,
  type TestClient,
} from "@/test-client";

/** テストのために DB に直接入れる、画像の行の値。 */
type ImageValues = Partial<typeof image.$inferInsert>;

/** テストのために DB に直接入れる、配信用の画像の行の値。 */
type DeliveryImageValues = typeof deliveryImage.$inferInsert;

const openTestDatabase = (server: TestClient) =>
  openDatabase({
    target: toTestDatabaseTarget(server.databaseName),
    logger: { write: () => undefined },
    max: 1,
  });

const insertImages = async (
  server: TestClient,
  values: readonly ImageValues[],
): Promise<string[]> => {
  await using connection = openTestDatabase(server);

  const rows = await connection.db
    .insert(image)
    .values(
      values.map((value) => ({
        publishedAt: TEST_NOW,
        createdAt: TEST_NOW,
        updatedAt: TEST_NOW,
        ...value,
      })),
    )
    .returning({ id: image.id });

  return rows.map(({ id }) => id);
};

const insertDeliveryImages = async (
  server: TestClient,
  values: readonly DeliveryImageValues[],
): Promise<void> => {
  await using connection = openTestDatabase(server);

  await connection.db.insert(deliveryImage).values([...values]);
};

/** 画像の一覧の1ページ。 */
type ImagePage = ContractOutputs["admin"]["images"]["list"];

/** 画像の書き換えで送る値。 */
type ImageUpdate = ContractInputs["admin"]["images"]["update"];

const MISSING_ID = "019b0000-0000-7000-8000-000000000000";

const titlesOf = (page: ImagePage): (string | null)[] =>
  page.images.map(({ title }) => title);

describe("画像の一覧", () => {
  test("公開していない画像も含めて、新しく足した順に、cursor で続きを返し、途中で足した画像で続きがずれないこと", async () => {
    await using server = await createTestClient();

    await signInAsAdmin(server);

    const ids = await insertImages(server, [
      { title: "1" },
      { title: "2", publishedAt: null },
      { title: "3" },
      { title: "4" },
      { title: "5" },
    ]);

    const list = server.client.admin.images.list;
    const first = await list({ limit: 2 });

    expect(titlesOf(first)).toEqual(["5", "4"]);
    expect(first.nextCursor).toBe(ids[3] ?? "");

    await insertImages(server, [{ title: "6" }]);

    const second = await list({ cursor: first.nextCursor ?? "", limit: 2 });

    expect(titlesOf(second)).toEqual(["3", "2"]);
    expect(second.images.map(({ published }) => published)).toEqual([
      true,
      false,
    ]);
    expect(
      await server.client.admin.images.get({ id: ids[1] ?? "" }),
    ).toMatchObject({ title: "2", published: false, publishedAt: null });

    const last = await list({ cursor: second.nextCursor ?? "", limit: 2 });

    expect(titlesOf(last)).toEqual(["1"]);
    expect(last.nextCursor).toBeNull();
    const all = await list({ limit: 6 });

    expect(titlesOf(all)).toEqual(["6", "5", "4", "3", "2", "1"]);
    expect(all.nextCursor).toBeNull();
  });

  test("件数を省くと、50件ずつ返すこと", async () => {
    await using server = await createTestClient();

    await signInAsAdmin(server);
    await insertImages(
      server,
      Array.from({ length: 51 }, (_, index) => ({ title: String(index) })),
    );

    const first = await server.client.admin.images.list({});

    expect(first.images).toHaveLength(50);
    expect(
      await server.client.admin.images.list({ cursor: first.nextCursor ?? "" }),
    ).toMatchObject({ images: [{ title: "0" }], nextCursor: null });
  });

  test("件数が1〜100でないか、cursor が ID でなければ BAD_REQUEST で断ること", async () => {
    await using server = await createTestClient();

    await signInAsAdmin(server);

    const list = server.client.admin.images.list;

    expect(await catchErrorCode(list({ limit: 0 }))).toBe("BAD_REQUEST");
    expect(await catchErrorCode(list({ limit: 101 }))).toBe("BAD_REQUEST");
    expect(await catchErrorCode(list({ cursor: "5" }))).toBe("BAD_REQUEST");
  });
});

describe("画像の取得", () => {
  test("撮影の情報を含めて画像を返し、無い ID は NOT_FOUND で断ること", async () => {
    await using server = await createTestClient();

    await signInAsAdmin(server);

    const [id = ""] = await insertImages(server, [
      {
        title: "夕立",
        description: "駅前で。\n傘を持っていなかった。",
        alt: "雨に濡れた横断歩道",
        takenAt: "2025-05-01 14:03:27",
        takenAtOffsetMinutes: 540,
        camera: "FUJIFILM X-T5",
        lens: "XF23mmF1.4 R LM WR",
        focalLength: 23,
        fNumber: 2.8,
        exposureTime: 0.004,
        iso: 160,
      },
    ]);

    const found = await server.client.admin.images.get({ id });

    expect(found).toEqual({
      id,
      title: "夕立",
      description: "駅前で。\n傘を持っていなかった。",
      alt: "雨に濡れた横断歩道",
      takenAt: "2025-05-01T14:03:27",
      takenAtOffset: "+09:00",
      camera: "FUJIFILM X-T5",
      lens: "XF23mmF1.4 R LM WR",
      focalLength: 23,
      fNumber: 2.8,
      exposureTime: 0.004,
      iso: 160,
      published: true,
      publishedAt: TEST_NOW.toISOString(),
      createdAt: TEST_NOW.toISOString(),
      updatedAt: TEST_NOW.toISOString(),
      deliveryImages: [],
    });
    expect((await server.client.admin.images.list({})).images).toEqual([found]);
    expect(
      await catchErrorCode(server.client.admin.images.get({ id: MISSING_ID })),
    ).toBe("NOT_FOUND");
  });
});

describe("配信用の画像", () => {
  test("一覧・取得・書き換え・公開・非公開は、配信用の画像の幅・高さ・URL を幅の昇順で返し、一覧は配信用の画像をまだ作っていない画像に空の一覧を返すこと", async () => {
    await using server = await createTestClient();

    await signInAsAdmin(server);

    const [id = ""] = await insertImages(server, [
      { title: "夕立" },
      { title: "まだ作っていない" },
    ]);

    await insertDeliveryImages(
      server,
      [
        [1280, 853],
        [2560, 1707],
        [640, 427],
      ].map(([width = 0, height = 0]) => ({
        imageId: id,
        width,
        height,
        fileKey: `${id}-${width}.avif`,
      })),
    );

    const expected = [
      { width: 640, height: 427, url: `/media/${id}/640.avif` },
      { width: 1280, height: 853, url: `/media/${id}/1280.avif` },
      { width: 2560, height: 1707, url: `/media/${id}/2560.avif` },
    ];

    const images = server.client.admin.images;

    expect(
      (await images.list({})).images.map(({ deliveryImages, title }) => ({
        title,
        deliveryImages,
      })),
    ).toEqual([
      { title: "まだ作っていない", deliveryImages: [] },
      { title: "夕立", deliveryImages: expected },
    ]);
    expect((await images.get({ id })).deliveryImages).toEqual(expected);
    expect(
      (
        await images.update({
          id,
          title: "夕立のあと",
          description: null,
          alt: null,
        })
      ).deliveryImages,
    ).toEqual(expected);
    expect((await images.unpublish({ id })).deliveryImages).toEqual(expected);
    expect((await images.publish({ id })).deliveryImages).toEqual(expected);
  });
});

describe("画像の書き換え", () => {
  test("タイトル・説明・alt のどれかを変えたときだけ、更新した日時を進めること", async () => {
    let now = TEST_NOW;
    await using server = await createTestClient({ clock: { now: () => now } });

    await signInAsAdmin(server);

    const [id = ""] = await insertImages(server, [
      { title: "夕立", description: "駅前で。", alt: "横断歩道" },
    ]);

    let values: ImageUpdate = {
      id,
      title: "夕立",
      description: "駅前で。",
      alt: "横断歩道",
    };

    const save = async (
      day: number,
      change: Partial<ImageUpdate>,
    ): Promise<string> => {
      now = new Date(Date.UTC(2026, 0, day));
      values = { ...values, ...change };

      return (await server.client.admin.images.update(values)).updatedAt;
    };

    expect(await save(2, { title: " 夕立のあと " })).toBe(
      "2026-01-02T00:00:00.000Z",
    );
    expect(await save(3, { description: null })).toBe(
      "2026-01-03T00:00:00.000Z",
    );
    expect(await save(4, { alt: "雨に濡れた横断歩道" })).toBe(
      "2026-01-04T00:00:00.000Z",
    );
    expect(await save(5, {})).toBe("2026-01-04T00:00:00.000Z");
    expect(await server.client.admin.images.get({ id })).toMatchObject({
      title: "夕立のあと",
      description: null,
      alt: "雨に濡れた横断歩道",
      published: true,
      updatedAt: "2026-01-04T00:00:00.000Z",
    });
  });

  test("無い ID は NOT_FOUND、空のタイトルや改行のある alt は BAD_REQUEST で断ること", async () => {
    await using server = await createTestClient();

    await signInAsAdmin(server);

    const [id = ""] = await insertImages(server, [{}]);

    const update = async (values: Partial<ImageUpdate>): Promise<string> =>
      catchErrorCode(
        server.client.admin.images.update({
          id,
          title: null,
          description: null,
          alt: null,
          ...values,
        }),
      );

    expect(await update({ id: MISSING_ID })).toBe("NOT_FOUND");
    expect(await update({ title: "  " })).toBe("BAD_REQUEST");
    expect(await update({ alt: "雨に濡れた\n横断歩道" })).toBe("BAD_REQUEST");
    expect(
      await update({ description: "駅前で。\n傘を持っていなかった。" }),
    ).toBe(SUCCEEDED);
  });
});

describe("公開と非公開", () => {
  test("非公開にすると公開した日時を消し、公開し直した日時を公開した日時にして、更新した日時は変えないこと", async () => {
    let now = new Date("2026-01-02T00:00:00.000Z");
    await using server = await createTestClient({ clock: { now: () => now } });

    await signInAsAdmin(server);

    const [id = ""] = await insertImages(server, [{ title: "夕立" }]);
    const images = server.client.admin.images;

    expect(await images.unpublish({ id })).toMatchObject({
      published: false,
      publishedAt: null,
      updatedAt: TEST_NOW.toISOString(),
    });

    const republished = now;

    expect(await images.publish({ id })).toMatchObject({
      published: true,
      publishedAt: republished.toISOString(),
      updatedAt: TEST_NOW.toISOString(),
    });

    now = new Date("2026-01-03T00:00:00.000Z");

    expect(await images.publish({ id })).toMatchObject({
      publishedAt: republished.toISOString(),
    });
  });

  test("無い ID は NOT_FOUND で断ること", async () => {
    await using server = await createTestClient();

    await signInAsAdmin(server);

    const images = server.client.admin.images;

    expect(await catchErrorCode(images.publish({ id: MISSING_ID }))).toBe(
      "NOT_FOUND",
    );
    expect(await catchErrorCode(images.unpublish({ id: MISSING_ID }))).toBe(
      "NOT_FOUND",
    );
  });
});

describe("画像の削除", () => {
  test("配信用の画像がある画像も消せ、消した画像は配信用の画像ごと一覧からも取得からも無くなり、cursor の画像を消しても続きを読めること", async () => {
    await using server = await createTestClient();

    await signInAsAdmin(server);

    const [, , id = ""] = await insertImages(server, [
      { title: "1" },
      { title: "2" },
      { title: "3" },
    ]);

    await insertDeliveryImages(server, [
      { imageId: id, width: 640, height: 427, fileKey: `${id}-640.avif` },
    ]);

    const images = server.client.admin.images;
    const first = await images.list({ limit: 1 });

    expect(first.nextCursor).toBe(id);

    await images.delete({ id });

    expect(
      titlesOf(await images.list({ cursor: first.nextCursor ?? "" })),
    ).toEqual(["2", "1"]);
    expect(titlesOf(await images.list({}))).toEqual(["2", "1"]);
    expect(await catchErrorCode(images.get({ id }))).toBe("NOT_FOUND");
    expect(await catchErrorCode(images.delete({ id }))).toBe("NOT_FOUND");

    await insertImages(server, [{ id, title: "3" }]);

    expect((await images.get({ id })).deliveryImages).toEqual([]);
  });
});
