import { safe } from "@orpc/client";
import { describe, expect, test } from "bun:test";

import { createFakeApi } from "@/testing/create-fake-api";
import { createImageRoutes } from "@/testing/fake-routes/create-image-routes";

const MISSING_ID = "019b0000-0000-7000-8000-0000000000ff";

const setUp = (count = 3) => {
  const server = createImageRoutes(
    Array.from({ length: count }, (_, index) => ({
      title: `写真 ${index + 1}`,
      published: index !== 1,
    })),
  );

  return { server, api: createFakeApi(server.routes).api };
};

describe("createImageRoutes", () => {
  test("一覧は渡した順(新しく足した順)に返し、省いた項目は null にする", async () => {
    const { api } = setUp();
    const { images, nextCursor } = await api.admin.images.list({});

    expect(images.map(({ title }) => title)).toEqual([
      "写真 1",
      "写真 2",
      "写真 3",
    ]);
    expect(images.map(({ published }) => published)).toEqual([
      true,
      false,
      true,
    ]);
    expect(images[0]).toMatchObject({ alt: null, takenAt: null, iso: null });
    expect(nextCursor).toBeNull();
  });

  test("配信用の画像は幅の小さい順に返す", async () => {
    const server = createImageRoutes([
      {
        deliveryImages: [
          { width: 2048, height: 1024, url: "/media/large.avif" },
          { width: 640, height: 320, url: "/media/small.avif" },
        ],
      },
    ]);

    const { api } = createFakeApi(server.routes);
    const { images } = await api.admin.images.list({});

    expect(images[0]?.deliveryImages.map(({ width }) => width)).toEqual([
      640, 2048,
    ]);
  });

  test("cursor の後ろの画像を、件数で区切って返す", async () => {
    const { api } = setUp(5);
    const first = await api.admin.images.list({ limit: 2 });

    expect(first.images.map(({ title }) => title)).toEqual([
      "写真 1",
      "写真 2",
    ]);

    const second = await api.admin.images.list({
      limit: 2,
      cursor: first.nextCursor ?? undefined,
    });

    expect(second.images.map(({ title }) => title)).toEqual([
      "写真 3",
      "写真 4",
    ]);

    const last = await api.admin.images.list({
      limit: 2,
      cursor: second.nextCursor ?? undefined,
    });

    expect(last.images.map(({ title }) => title)).toEqual(["写真 5"]);
    expect(last.nextCursor).toBeNull();
  });

  test("書き換えは変わったときだけ updatedAt を進める", async () => {
    const { api, server } = setUp();
    const [image] = server.images();

    if (image === undefined) throw new Error("画像がありません");

    const same = await api.admin.images.update({
      id: image.id,
      title: image.title,
      description: null,
      alt: null,
    });

    expect(same.updatedAt).toBe(image.updatedAt);

    const changed = await api.admin.images.update({
      id: image.id,
      title: "夕暮れ",
      description: null,
      alt: "山並み",
    });

    expect(changed).toMatchObject({ title: "夕暮れ", alt: "山並み" });
    expect(changed.updatedAt).not.toBe(image.updatedAt);
  });

  test("公開し直しても、公開した日時を変えない", async () => {
    const { api, server } = setUp();
    const [image] = server.images();

    if (image === undefined) throw new Error("画像がありません");

    const again = await api.admin.images.publish({ id: image.id });

    expect(again.publishedAt).toBe(image.publishedAt);

    const hidden = await api.admin.images.unpublish({ id: image.id });

    expect(hidden).toMatchObject({ published: false, publishedAt: null });
  });

  test("消した画像は一覧から無くなり、無い画像の操作は NOT_FOUND で断る", async () => {
    const { api, server } = setUp();
    const [image] = server.images();

    if (image === undefined) throw new Error("画像がありません");

    await api.admin.images.delete({ id: image.id });
    expect(server.images()).toHaveLength(2);

    const [got] = await safe(api.admin.images.get({ id: MISSING_ID }));

    const [published] = await safe(
      api.admin.images.publish({ id: MISSING_ID }),
    );

    const [deleted] = await safe(api.admin.images.delete({ id: image.id }));

    expect([got, published, deleted]).toMatchObject([
      { code: "NOT_FOUND" },
      { code: "NOT_FOUND" },
      { code: "NOT_FOUND" },
    ]);
  });

  test("replyNext で決めた応答を、次の1回だけ返す", async () => {
    const { api, server } = setUp();

    server.replyNext("admin/images/list", () => ({
      error: "INTERNAL_SERVER_ERROR",
      defined: false,
    }));

    const [error] = await safe(api.admin.images.list({}));

    expect(error).toMatchObject({ code: "INTERNAL_SERVER_ERROR" });
    expect((await api.admin.images.list({})).images).toHaveLength(3);
  });
});
