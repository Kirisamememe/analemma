import { describe, expect, test } from "bun:test";

import { imageTagAssignment } from "@/db/schema/image-tags";
import {
  catchErrorCode,
  createTestClient,
  signInAsAdmin,
  insertImages,
  openTestDatabase,
  type TestClient,
} from "@/test-client";

const seedLibrary = async (server: TestClient) => {
  const { imageTags } = server.client.admin;
  const coast = await imageTags.create({ name: "海" });
  const winter = await imageTags.create({ name: "冬" });

  const ids = await insertImages(server, [
    { title: "写真10" },
    { title: "写真3", status: "processing", publishedAt: null },
    { title: "写真2", status: "unreadable", publishedAt: null },
    { title: "写真1", status: "interrupted", publishedAt: null },
    { title: "写真2", status: "unpublished", publishedAt: null },
  ]);

  await using connection = openTestDatabase(server);
  const [ten = "", three = "", two = "", one = "", otherTwo = ""] = ids;
  await connection.db.insert(imageTagAssignment).values([
    { imageId: ten, tagId: coast.id },
    { imageId: ten, tagId: winter.id },
    { imageId: three, tagId: winter.id },
    { imageId: two, tagId: coast.id },
    { imageId: one, tagId: coast.id },
  ]);

  return { coast: coast.id, winter: winter.id, ten, three, two, one, otherTwo };
};

describe("画像一覧の枚数", () => {
  test("ページの外も数え、変換失敗をまとめ、該当する画像がある状態だけを返すこと", async () => {
    await using server = await createTestClient();
    await signInAsAdmin(server);
    const { images } = server.client.admin;
    expect(await images.counts({})).toEqual({
      total: 0,
      untagged: 0,
      any: 0,
      all: 0,
      byStatus: [],
    });
    const { coast, winter } = await seedLibrary(server);
    expect(
      (await images.list({ tags: [coast, winter], limit: 1 })).images,
    ).toHaveLength(1);
    expect(await images.counts({ tags: [coast, winter] })).toEqual({
      total: 5,
      untagged: 1,
      any: 4,
      all: 1,
      byStatus: [
        { status: "published", count: 1 },
        { status: "processing", count: 1 },
        { status: "failed", count: 2 },
      ],
    });
    expect(
      await images.counts({ tags: [coast, winter], match: "all" }),
    ).toEqual({
      total: 5,
      untagged: 1,
      any: 4,
      all: 1,
      byStatus: [{ status: "published", count: 1 }],
    });
    expect(await images.counts({ tags: "untagged" })).toEqual({
      total: 5,
      untagged: 1,
      any: 1,
      all: 1,
      byStatus: [{ status: "unpublished", count: 1 }],
    });
  });
});

describe("絞り込み後の前後の画像", () => {
  test("同じタイトルと数字を含むタイトルでも、一覧と同じ条件で、読み込んだページを越えて移動できること", async () => {
    await using server = await createTestClient();
    await signInAsAdmin(server);
    const { images } = server.client.admin;

    const { coast, winter, ten, three, two, one, otherTwo } =
      await seedLibrary(server);

    expect(
      (await images.list({ order: "title", limit: 1 })).images.map(
        (row) => row.id,
      ),
    ).toEqual([one]);
    expect(await images.browseNeighbors({ id: two, order: "title" })).toEqual({
      previous: otherTwo,
      next: three,
    });
    expect(
      await images.browseNeighbors({ id: two, order: "title", tags: [coast] }),
    ).toEqual({ previous: one, next: ten });
    expect(
      await images.browseNeighbors({
        id: ten,
        tags: [coast, winter],
        match: "all",
      }),
    ).toEqual({ previous: null, next: null });
    expect(await images.browseNeighbors({ id: two, tags: [coast] })).toEqual({
      previous: one,
      next: ten,
    });
    expect(
      await images.browseNeighbors({ id: otherTwo, tags: "untagged" }),
    ).toEqual({ previous: null, next: null });
  });

  test("一覧の条件から外れた画像では前後を空にし、削除された画像は NOT_FOUND にすること", async () => {
    await using server = await createTestClient();
    await signInAsAdmin(server);
    const { images } = server.client.admin;
    const { coast, three } = await seedLibrary(server);
    expect(await images.browseNeighbors({ id: three, tags: [coast] })).toEqual({
      previous: null,
      next: null,
    });
    await images.delete({ id: three });
    expect(await catchErrorCode(images.browseNeighbors({ id: three }))).toBe(
      "NOT_FOUND",
    );
  });
});
