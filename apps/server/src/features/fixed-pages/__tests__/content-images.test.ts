import { expect, test } from "bun:test";

import type {
  KindDefinitionInput,
  PublishedImageValue,
} from "@analemma/contract";

import { deliveryImage } from "@/db/schema/delivery-image";
import { fixedPage } from "@/db/schema/fixed-page";
import { image } from "@/db/schema/image";
import { kind } from "@/db/schema/kind";
import { openDatabase } from "@/platform/database";
import { toTestDatabaseTarget } from "@/platform/test-database/to-test-database-target";
import {
  createTestClient,
  prepareTestKinds,
  TEST_NOW,
  TEST_ORIGIN,
} from "@/test-client";

const photo = { type: "image", key: "photo", label: "写真" } as const;

const gallery: KindDefinitionInput = {
  name: "gallery",
  label: "写真集",
  fields: [
    photo,
    { key: "caption", label: "説明", type: "text", optional: true },
    { ...photo, key: "cover", optional: true },
    {
      type: "group",
      key: "album",
      label: "アルバム",
      fields: [
        { type: "repeat", key: "pages", label: "ページ", fields: [photo] },
      ],
    },
  ],
};

const page = { kind: "gallery", slug: "sea", title: "海" };

test("以前の真偽値の定義が残った公開ページを、定義を送り直す前にも読めること", async () => {
  await using server = await createTestClient();
  await using connection = openDatabase({
    target: toTestDatabaseTarget(server.databaseName),
    logger: { write: () => undefined },
  });
  const dates = { createdAt: TEST_NOW, updatedAt: TEST_NOW };
  await connection.db.insert(kind).values({
    ...dates,
    name: page.kind,
    label: "写真集",
    fields: [
      { type: "boolean", key: "listed", label: "表示", optional: false },
    ],
  });
  const content = { listed: false, note: "撮影記録" };
  await connection.db.insert(fixedPage).values({
    ...dates,
    ...page,
    content,
    position: 0,
    publishedAt: TEST_NOW,
  });

  const result = await server
    .internal()
    .public.fixedPages.get({ kind: page.kind, slug: page.slug });

  expect(result.content).toEqual(content);
});

test("必須の画像の未入力と入れ子の画像の ID の形式を検査すること", async () => {
  await using server = await createTestClient();
  await prepareTestKinds(server, [gallery]);

  const create = server.client.admin.fixedPages.create;
  expect(
    await create({ ...page, content: { album: { pages: [] } } }).catch(
      (error: unknown) => error,
    ),
  ).toMatchObject({
    code: "INVALID_CONTENT",
    data: { issues: [{ path: ["photo"], code: "invalid_type" }] },
  });
  expect(
    await create({
      ...page,
      content: {
        photo: crypto.randomUUID(),
        album: { pages: [{ photo: "海" }] },
      },
    }).catch((error: unknown) => error),
  ).toMatchObject({
    code: "INVALID_CONTENT",
    data: {
      issues: [
        { path: ["album", "pages", 0, "photo"], code: "invalid_format" },
      ],
    },
  });
});

test("無い画像の ID も保存でき、公開 API では取れない画像として返すこと", async () => {
  await using server = await createTestClient();
  await prepareTestKinds(server, [gallery]);
  const pages = server.client.admin.fixedPages;
  const missing = crypto.randomUUID();
  const content = { photo: missing, album: { pages: [{ photo: missing }] } };
  const saved = await pages.create({ ...page, content });
  expect(saved.content).toEqual(content);
  await pages.publish({ id: saved.id });

  const published = await server
    .internal()
    .public.fixedPages.get({ kind: page.kind, slug: page.slug });

  expect(published.content).toEqual({
    photo: { available: false },
    album: { pages: [{ photo: { available: false } }] },
  });
});

test("公開 API は画像を配信用の絶対 URL と一緒に返し、必須の画像を非公開にしても削除してもページを返すこと", async () => {
  await using server = await createTestClient();
  const token = await prepareTestKinds(server, [gallery]);
  await using connection = openDatabase({
    target: toTestDatabaseTarget(server.databaseName),
    logger: { write: () => undefined },
  });
  const id = crypto.randomUUID();
  const second = crypto.randomUUID();
  const dates = { createdAt: TEST_NOW, updatedAt: TEST_NOW };
  await connection.db.insert(image).values([
    { id, ...dates },
    { id: second, ...dates, publishedAt: TEST_NOW },
  ]);
  await connection.db.insert(deliveryImage).values({
    imageId: id,
    width: 640,
    height: 320,
    fileKey: `${id}-640.avif`,
  });

  const admin = server.client.admin;
  const api = server.internal().public;

  const content = {
    photo: id.toUpperCase(),
    album: { pages: [{ photo: second }, { photo: id }] },
    note: id,
  };

  const saved = await admin.fixedPages.create({ ...page, content });
  expect(saved.content).toEqual(content);
  await admin.fixedPages.publish({ id: saved.id });
  const get = () => api.fixedPages.get({ kind: page.kind, slug: page.slug });

  const other = {
    available: true,
    image: await api.images.get({ id: second }),
  };

  const unavailable = { available: false } as const;

  const expected = (photoValue: PublishedImageValue) => ({
    photo: photoValue,
    album: { pages: [{ photo: other }, { photo: photoValue }] },
    note: id,
  });

  expect((await get()).content).toEqual(expected(unavailable));
  await admin.images.publish({ id });
  const published = await api.images.get({ id });
  expect(published.deliveryImages).toEqual([
    { width: 640, height: 320, url: `${TEST_ORIGIN}/media/${id}/640.avif` },
  ]);
  expect((await get()).content).toEqual(
    expected({ available: true, image: published }),
  );
  await admin.images.unpublish({ id });
  expect((await get()).content).toEqual(expected(unavailable));
  await admin.images.delete({ id });
  expect((await get()).content).toEqual(expected(unavailable));
  const caption = "夏の海";
  await admin.fixedPages.update({
    ...page,
    id: saved.id,
    content: { ...content, caption },
  });
  expect((await admin.fixedPages.get({ id: saved.id })).content).toEqual({
    ...content,
    caption,
  });
  expect((await get()).content).toEqual({ ...expected(unavailable), caption });
  await server
    .internal(token)
    .deploy.kinds.push({ kinds: [{ ...gallery, label: "写真" }] });
});
