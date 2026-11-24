import { expect, test } from "bun:test";

import { deliveryImage } from "@/db/schema/delivery-image";
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

const fields = { name: "海辺", slug: "sea", description: null };
const missing = "019b0000-0000-7000-8000-000000000000";

const addTestImages = async (server: TestClient) => {
  await using connection = openDatabase({
    target: toTestDatabaseTarget(server.databaseName),
    logger: { write: () => undefined },
  });

  const dates = {
    createdAt: TEST_NOW,
    updatedAt: TEST_NOW,
    publishedAt: TEST_NOW,
  };

  const rows = await connection.db
    .insert(image)
    .values([dates, dates, dates])
    .returning({ id: image.id });

  const ids = rows.map((row) => row.id);
  const [first = ""] = ids;
  await connection.db.insert(deliveryImage).values(
    [1280, 640].map((width) => ({
      imageId: first,
      width,
      height: (width * 3) / 4,
      fileKey: `${first}-${width}.avif`,
    })),
  );

  return ids;
};

// ----------------------------------------
// 管理用 API
// ----------------------------------------

test("作品集を非公開で作り、新しく作った順に一覧に返すこと", async () => {
  await using server = await createTestClient();
  await signInAsAdmin(server);
  const api = server.client.admin.collections;
  const first = await api.create(fields);
  const { id } = first;
  const second = await api.create({ ...fields, slug: "sky" });
  expect((await api.list()).collections).toEqual([
    { ...second, imageCount: 0, coverImage: null },
    { ...first, imageCount: 0, coverImage: null },
  ]);
  expect(first).toMatchObject({
    ...fields,
    published: false,
    publishedAt: null,
  });
  expect(await api.get({ id })).toEqual({ ...first, images: [] });
  expect(await catchErrorCode(api.create(fields))).toBe("SLUG_TAKEN");
  expect(
    await catchErrorCode(api.create({ ...fields, slug: "Bad Slug" })),
  ).toBe("BAD_REQUEST");
  expect(await catchErrorCode(api.update({ ...fields, id: second.id }))).toBe(
    "SLUG_TAKEN",
  );
  expect((await api.get({ id: second.id })).slug).toBe("sky");

  const updated = {
    name: "夏の海辺",
    slug: "summer-sea",
    description: "夏の記録",
  };

  await api.update({ id, ...updated });
  expect(await api.get({ id })).toMatchObject(updated);
  await api.update({ id, ...fields });
  expect((await api.get({ id })).description).toBeNull();
});

test("公開し直しても公開した日時を保ち、非公開に戻すと消すこと", async () => {
  let now = TEST_NOW;
  await using server = await createTestClient({ clock: { now: () => now } });
  await signInAsAdmin(server);
  const api = server.client.admin.collections;
  const { id } = await api.create(fields);
  const published = await api.publish({ id });
  expect(published).toMatchObject({
    published: true,
    publishedAt: now.toISOString(),
  });
  now = new Date(now.getTime() + 1000);
  expect(await api.publish({ id })).toEqual(published);
  expect(await api.unpublish({ id })).toMatchObject({
    published: false,
    publishedAt: null,
  });
  await api.delete({ id });
  expect((await api.list()).collections).toEqual([]);

  for (const operation of [
    () => api.get({ id }),
    () => api.update({ id, ...fields }),
    () => api.delete({ id }),
    () => api.publish({ id }),
    () => api.unpublish({ id }),
    () => api.addImages({ id, imageIds: [] }),
    () => api.removeImages({ id, imageIds: [] }),
    () => api.reorder({ id, imageIds: [] }),
  ]) {
    expect(await catchErrorCode(operation())).toBe("NOT_FOUND");
  }
});

test("画像は作品集ごとに並び、公開状態を変えても残り、画像を消すとすべての作品集から外れること", async () => {
  await using server = await createTestClient();
  await signInAsAdmin(server);
  const api = server.client.admin.collections;
  const { id } = await api.create(fields);
  const other = await api.create({ ...fields, slug: "other" });
  const [first = "", second = "", third = ""] = await addTestImages(server);
  await api.addImages({ id, imageIds: [second, first] });
  await api.addImages({ id, imageIds: [first.toUpperCase(), third, third] });
  await api.addImages({ id: other.id, imageIds: [third, first] });

  const ids = async (collectionId: string) =>
    (await api.get({ id: collectionId })).images.map((row) => row.id);

  expect(await ids(id)).toEqual([second, first, third]);
  await api.reorder({ id, imageIds: [first.toUpperCase(), third, second] });
  expect(await ids(id)).toEqual([first, third, second]);
  expect(await ids(other.id)).toEqual([third, first]);
  await server.client.admin.images.unpublish({ id: first });
  const cover = await server.client.admin.images.get({ id: first });
  expect(cover.deliveryImages).toEqual([
    { width: 640, height: 480, url: `/media/${first}/640.avif` },
    { width: 1280, height: 960, url: `/media/${first}/1280.avif` },
  ]);
  expect((await api.get({ id })).images[0]).toEqual(cover);
  expect((await api.list()).collections).toMatchObject([
    { id: other.id, imageCount: 2, coverImage: { id: third } },
    { id, imageCount: 3, coverImage: cover },
  ]);
  await server.client.admin.images.delete({ id: first });
  expect(await ids(id)).toEqual([third, second]);
  expect(await ids(other.id)).toEqual([third]);
  await api.removeImages({ id, imageIds: [missing, third] });
  expect(await ids(id)).toEqual([second]);
  expect(await ids(other.id)).toEqual([third]);
  await api.delete({ id: other.id });
  expect((await server.client.admin.images.get({ id: third })).id).toBe(third);
});

test("無い画像を含む追加と、画像の集まりが食い違う並べ直しは、並びを変えずに断ること", async () => {
  await using server = await createTestClient();
  await signInAsAdmin(server);
  const api = server.client.admin.collections;
  const { id } = await api.create(fields);
  const [first = "", second = "", third = ""] = await addTestImages(server);
  await api.reorder({ id, imageIds: [] });
  await api.addImages({ id, imageIds: [first, second] });
  expect(
    await catchErrorCode(api.addImages({ id, imageIds: [third, missing] })),
  ).toBe("NOT_FOUND");

  for (const imageIds of [
    [second],
    [second, first, third],
    [second, third],
    [second, second],
  ]) {
    expect(await catchErrorCode(api.reorder({ id, imageIds }))).toBe(
      "ORDER_MISMATCH",
    );
  }

  expect((await api.get({ id })).images.map((row) => row.id)).toEqual([
    first,
    second,
  ]);
});

// ----------------------------------------
// 公開 API
// ----------------------------------------

test("公開している作品集の並び順・カバー・件数は公開画像だけを使い、公開画像が無くても作品集を返すこと", async () => {
  await using server = await createTestClient();
  await signInAsAdmin(server);
  const admin = server.client.admin;
  const api = server.internal().public;
  const { id } = await admin.collections.create(fields);
  const key = { slug: fields.slug };
  const [cover = "", hidden = "", last = ""] = await addTestImages(server);
  await admin.collections.addImages({ id, imageIds: [hidden, last, cover] });
  await admin.images.unpublish({ id: hidden });
  expect(await api.collections.list()).toEqual({ collections: [] });
  expect(await catchErrorCode(api.collections.get(key))).toBe("NOT_FOUND");
  expect(await catchErrorCode(api.collections.get({ slug: "missing" }))).toBe(
    "NOT_FOUND",
  );
  await admin.collections.publish({ id });
  const first = await api.images.get({ id: cover });
  const second = await api.images.get({ id: last });
  expect(await api.collections.get(key)).toEqual({
    ...fields,
    images: [second, first],
  });
  await admin.collections.reorder({ id, imageIds: [hidden, cover, last] });
  expect(await api.collections.get(key)).toEqual({
    ...fields,
    images: [first, second],
  });
  const otherFields = { name: "空", slug: "sky", description: "夏の記録" };
  const other = await admin.collections.create(otherFields);
  await admin.collections.addImages({ id: other.id, imageIds: [last] });
  await admin.collections.publish({ id: other.id });
  expect(await api.collections.list()).toEqual({
    collections: [
      { ...otherFields, imageCount: 1, coverImage: second },
      { ...fields, imageCount: 2, coverImage: first },
    ],
  });
  await admin.collections.removeImages({ id: other.id, imageIds: [last] });
  expect(await api.collections.get({ slug: otherFields.slug })).toEqual({
    ...otherFields,
    images: [],
  });
  await admin.collections.unpublish({ id: other.id });
  await admin.images.delete({ id: cover });
  expect(await api.collections.list()).toEqual({
    collections: [{ ...fields, imageCount: 1, coverImage: second }],
  });
  await admin.images.unpublish({ id: last });
  expect(await api.collections.get(key)).toEqual({ ...fields, images: [] });
  expect(await api.collections.list()).toEqual({
    collections: [{ ...fields, imageCount: 0, coverImage: null }],
  });
});
