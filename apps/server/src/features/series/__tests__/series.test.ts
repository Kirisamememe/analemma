import { expect, test } from "bun:test";

import {
  catchErrorCode,
  createTestClient,
  signInAsAdmin,
  TEST_NOW,
} from "@/test-client";

const fields = { name: "海辺", slug: "sea", description: null };

test("シリーズを非公開で作り、新しく作った順に一覧に返すこと", async () => {
  await using server = await createTestClient();
  await signInAsAdmin(server);
  const api = server.client.admin.series;
  const first = await api.create(fields);
  const { id } = first;
  const second = await api.create({ ...fields, slug: "sky" });
  expect((await api.list()).series).toEqual([
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
  const api = server.client.admin.series;
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
  expect((await api.list()).series).toEqual([]);

  for (const operation of [
    () => api.get({ id }),
    () => api.update({ id, ...fields }),
    () => api.delete({ id }),
    () => api.publish({ id }),
    () => api.unpublish({ id }),
  ]) {
    expect(await catchErrorCode(operation())).toBe("NOT_FOUND");
  }
});
