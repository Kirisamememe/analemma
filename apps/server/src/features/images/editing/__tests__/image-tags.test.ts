import { describe, expect, test } from "bun:test";

import { image } from "@/db/schema/image";
import { openDatabase } from "@/platform/database";
import { toTestDatabaseTarget } from "@/platform/test-database/to-test-database-target";
import {
  catchErrorCode,
  createTestClient,
  signInAsAdmin,
  SUCCEEDED,
  TEST_NOW,
  type TestClient,
} from "@/test-client";

const addImage = async (server: TestClient) => {
  await using connection = openDatabase({
    target: toTestDatabaseTarget(server.databaseName),
    logger: { write: () => undefined },
  });
  const id = crypto.randomUUID();
  await connection.db.insert(image).values({
    id,
    status: "published",
    publishedAt: TEST_NOW,
    createdAt: TEST_NOW,
    updatedAt: TEST_NOW,
  });

  return id;
};

describe("画像のタグ", () => {
  test("一覧・取得・書き換え・公開の切り替え・シリーズ内の画像で、付けた順によらず管理順のタグを返すこと", async () => {
    await using server = await createTestClient();
    await signInAsAdmin(server);
    const { images, imageTags, series } = server.client.admin;
    const id = await addImage(server);
    const other = await addImage(server);
    const first = await imageTags.create({ name: "旅行" });
    const second = await imageTags.create({ name: "雨" });
    await images.addTag({ id, tagId: second.id });
    await images.addTag({ id, tagId: first.id });
    const expected = [first, second];

    expect((await images.get({ id })).tags).toEqual(expected);
    const { images: page } = await images.list({});
    expect(page.find((row) => row.id === id)?.tags).toEqual(expected);
    expect(page.find((row) => row.id === other)?.tags).toEqual([]);
    expect(
      (await images.update({ id, title: "京都", description: null, alt: null }))
        .tags,
    ).toEqual(expected);
    expect((await images.unpublish({ id })).tags).toEqual(expected);
    expect((await images.publish({ id })).tags).toEqual(expected);
    expect(
      await server.internal().public.images.get({ id }),
    ).not.toHaveProperty("tags");

    const collection = await series.create({
      name: "遠出",
      slug: "travel",
      description: null,
    });

    await series.addImages({ id: collection.id, imageIds: [id, other] });
    expect(
      (await series.get({ id: collection.id })).images.map((row) => row.tags),
    ).toEqual([expected, []]);
    expect((await series.list()).series[0]?.coverImage?.tags).toEqual(expected);

    const renamed = await imageTags.rename({ id: second.id, name: "雨の日" });
    await imageTags.reorder({ tagIds: [second.id, first.id] });
    expect((await images.get({ id })).tags).toEqual([renamed, first]);
  });

  test("同じタグを同時に付けても1つだけ残り、続けて外してもほかの画像のタグを保つこと", async () => {
    await using server = await createTestClient();
    await signInAsAdmin(server);
    const { images, imageTags } = server.client.admin;
    const id = await addImage(server);
    const other = await addImage(server);
    const tag = await imageTags.create({ name: "旅行" });
    const selection = { id, tagId: tag.id };

    await Promise.all([images.addTag(selection), images.addTag(selection)]);
    await images.addTag({ id: other, tagId: tag.id });
    expect((await images.get({ id })).tags).toEqual([tag]);
    await Promise.all([
      images.removeTag(selection),
      images.removeTag(selection),
    ]);
    expect((await images.get({ id })).tags).toEqual([]);
    expect((await images.get({ id: other })).tags).toEqual([tag]);

    await images.delete({ id: other });
    await imageTags.delete({ id: tag.id });
  });

  test("画像かタグが無ければ、付けるときも外すときも NOT_FOUND で断ること", async () => {
    await using server = await createTestClient();
    await signInAsAdmin(server);
    const { images, imageTags } = server.client.admin;
    const id = await addImage(server);
    const tag = await imageTags.create({ name: "旅行" });
    const missing = crypto.randomUUID();

    for (const change of [images.addTag, images.removeTag]) {
      expect(await catchErrorCode(change({ id, tagId: missing }))).toBe(
        "NOT_FOUND",
      );
      expect(await catchErrorCode(change({ id: missing, tagId: tag.id }))).toBe(
        "NOT_FOUND",
      );
    }
  });

  test("未使用のタグの削除と付与が重なると、一方だけが成功し、付与が成功したタグは画像に残ること", async () => {
    await using server = await createTestClient();
    await signInAsAdmin(server);
    const { images, imageTags } = server.client.admin;
    const id = await addImage(server);
    const tag = await imageTags.create({ name: "旅行" });

    const [added, removed] = await Promise.all([
      catchErrorCode(images.addTag({ id, tagId: tag.id })),
      catchErrorCode(imageTags.delete({ id: tag.id })),
    ]);

    const surviving = (await images.get({ id })).tags;

    if (added === SUCCEEDED) {
      expect(removed).toBe("TAG_IN_USE");
      expect(surviving).toEqual([tag]);
    } else {
      expect(added).toBe("NOT_FOUND");
      expect(removed).toBe(SUCCEEDED);
      expect(surviving).toEqual([]);
    }
  });
});
