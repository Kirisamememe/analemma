import { expect, test } from "bun:test";

import { deliveryImage } from "@/db/schema/delivery-image";
import { image } from "@/db/schema/image";
import { imageTagAssignment } from "@/db/schema/image-tags";
import { openDatabase } from "@/platform/database";
import { toTestDatabaseTarget } from "@/platform/test-database/to-test-database-target";
import {
  catchErrorCode,
  createTestClient,
  signInAsAdmin,
  TEST_NOW,
  SUCCEEDED,
} from "@/test-client";

const missing = "019b0000-0000-7000-8000-000000000000";

test("タグ名の前後の空白を除いて重複を断り、大小文字は区別すること", async () => {
  await using server = await createTestClient();
  const api = server.client.admin.imageTags;
  expect(await catchErrorCode(api.list())).toBe("UNAUTHORIZED");
  await signInAsAdmin(server);
  const first = await api.create({ name: "　Sea " });
  const second = await api.create({ name: "sea" });
  expect(first.name).toBe("Sea");
  expect(await catchErrorCode(api.create({ name: " Sea" }))).toBe("NAME_TAKEN");
  expect(await catchErrorCode(api.rename({ ...second, name: "Sea " }))).toBe(
    "NAME_TAKEN",
  );
  expect(await api.rename({ ...first, name: "海　" })).toEqual({
    ...first,
    name: "海",
  });
  expect(await api.rename({ ...first, name: "海" })).toEqual({
    ...first,
    name: "海",
  });

  for (const name of [" ", "山\n海", "山".repeat(201)]) {
    expect(await catchErrorCode(api.create({ name }))).toBe("BAD_REQUEST");
  }

  expect(await catchErrorCode(api.rename({ id: missing, name: "海" }))).toBe(
    "NOT_FOUND",
  );
});

test("タグを末尾に追加し、全タグを一度ずつ含む並びだけを保存すること", async () => {
  await using server = await createTestClient();
  await signInAsAdmin(server);
  const api = server.client.admin.imageTags;
  await api.reorder({ tagIds: [] });
  const first = await api.create({ name: "山" });
  const second = await api.create({ name: "海" });
  await api.reorder({ tagIds: [second.id.toUpperCase(), first.id] });

  for (const tagIds of [
    [second.id],
    [first.id, first.id],
    [first.id, missing],
  ]) {
    expect(await catchErrorCode(api.reorder({ tagIds }))).toBe(
      "ORDER_MISMATCH",
    );
  }

  const third = await api.create({ name: "川" });
  expect((await api.list()).tags).toEqual(
    [second, first, third].map(({ id, name }) => ({
      id,
      name,
      imageCount: 0,
      thumbnailUrls: [],
    })),
  );
  await api.delete({ id: first.id });
  expect((await api.list()).tags.map(({ id }) => id)).toEqual([
    second.id,
    third.id,
  ]);
  expect(await catchErrorCode(api.delete({ id: first.id }))).toBe("NOT_FOUND");
});

test("作成が並べ直しと重なっても、新しく作ったタグは最後に残ること", async () => {
  await using server = await createTestClient();
  await signInAsAdmin(server);
  const api = server.client.admin.imageTags;
  const first = await api.create({ name: "朝" });
  const second = await api.create({ name: "夜" });

  const [reordered, third] = await Promise.all([
    catchErrorCode(api.reorder({ tagIds: [second.id, first.id] })),
    api.create({ name: "昼" }),
  ]);

  const ids = (await api.list()).tags.map(({ id }) => id);

  if (reordered === "ORDER_MISMATCH") {
    expect(ids).toEqual([first.id, second.id, third.id]);
  } else {
    expect(reordered).toBe(SUCCEEDED);
    expect(ids).toEqual([second.id, first.id, third.id]);
  }
});

test("タグの使用枚数には変換中の画像も含め、サムネイルは変換済みの新しい2枚から最小幅を返すこと", async () => {
  await using server = await createTestClient();
  await signInAsAdmin(server);
  const api = server.client.admin.imageTags;
  const tag = await api.create({ name: "朝" });
  const other = await api.create({ name: "夏" });
  await using connection = openDatabase({
    target: toTestDatabaseTarget(server.databaseName),
    logger: { write: () => undefined },
  });

  const ids = Array.from({ length: 4 }, () => crypto.randomUUID()).toSorted();
  const [first = "", second = "", third = "", pending = ""] = ids;
  await connection.db.insert(image).values([
    ...[first, second, third].map((id) => ({
      id,
      createdAt: TEST_NOW,
      updatedAt: TEST_NOW,
      status: "unpublished" as const,
    })),
    {
      id: pending,
      createdAt: TEST_NOW,
      updatedAt: TEST_NOW,
      status: "processing",
    },
  ]);
  await connection.db.insert(deliveryImage).values(
    [first, second, third].flatMap((id) =>
      [640, 1280].map((width) => ({
        imageId: id,
        width,
        height: width,
        fileKey: `${id}-${width}.avif`,
      })),
    ),
  );
  await connection.db
    .insert(imageTagAssignment)
    .values([
      ...ids.map((id) => ({ tagId: tag.id, imageId: id })),
      { tagId: other.id, imageId: first },
    ]);
  expect((await api.list()).tags).toEqual([
    {
      ...tag,
      imageCount: 4,
      thumbnailUrls: [`/media/${third}/640.avif`, `/media/${second}/640.avif`],
    },
    { ...other, imageCount: 1, thumbnailUrls: [`/media/${first}/640.avif`] },
  ]);
  expect(await catchErrorCode(api.delete({ id: tag.id }))).toBe("TAG_IN_USE");
  await server.client.admin.images.delete({ id: first });
  expect((await api.list()).tags.map(({ imageCount }) => imageCount)).toEqual([
    3, 0,
  ]);
  await api.delete({ id: other.id });
});
