import { describe, expect, test } from "bun:test";

import type { ContractOutputs } from "@analemma/contract";

import { image } from "@/db/schema/image";
import { openDatabase } from "@/platform/database";
import { toTestDatabaseTarget } from "@/platform/test-database/to-test-database-target";
import {
  catchErrorCode,
  createTestClient,
  signInAsAdmin,
  TEST_NOW,
  type TestClient,
} from "@/test-client";

/** テストのために DB に直接入れる、画像の行の値。 */
type ImageValues = Partial<typeof image.$inferInsert>;

/** 画像の一覧の1ページ。 */
type ImagePage = ContractOutputs["admin"]["images"]["list"];

const MISSING_ID = "019b0000-0000-7000-8000-000000000000";

const insertImages = async (
  server: TestClient,
  values: readonly ImageValues[],
): Promise<string[]> => {
  await using connection = openDatabase({
    target: toTestDatabaseTarget(server.databaseName),
    logger: { write: () => undefined },
    max: 1,
  });

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
    });
    expect((await server.client.admin.images.list({})).images).toEqual([found]);
    expect(
      await catchErrorCode(server.client.admin.images.get({ id: MISSING_ID })),
    ).toBe("NOT_FOUND");
  });
});
