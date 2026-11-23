import { implement } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";
import { expect, test } from "bun:test";

import { contract } from "@analemma/contract";

import { createAnalemmaClient, image as imageField } from "../../index";

const id = "019b0000-0000-7000-8000-000000000001";

const image = {
  id,
  title: null,
  description: null,
  alt: null,
  takenAt: null,
  takenAtOffset: null,
  camera: null,
  lens: null,
  focalLength: null,
  fNumber: null,
  exposureTime: null,
  iso: null,
  deliveryImages: [
    {
      width: 640,
      height: 320,
      url: `http://localhost:5173/media/${id}/640.avif`,
    },
  ],
};

const series = { name: "海辺", slug: "sea", description: null };
const summary = { ...series, imageCount: 1, coverImage: image };
const url = "http://127.0.0.1:8788";

test("公開している画像とシリーズを取得し、無いときは undefined を返すこと", async () => {
  const os = implement({
    public: { images: contract.public.images, series: contract.public.series },
  });

  const handler = new RPCHandler(
    os.router({
      public: {
        images: {
          get: os.public.images.get.handler(({ input, errors }) => {
            if (input.id !== image.id) throw errors.NOT_FOUND();

            return image;
          }),
        },
        series: {
          get: os.public.series.get.handler(({ input, errors }) => {
            if (input.slug !== series.slug) throw errors.NOT_FOUND();

            return { ...series, images: [image] };
          }),
          list: os.public.series.list.handler(() => ({ series: [summary] })),
        },
      },
    }),
  );

  const client = createAnalemmaClient({
    url,
    fetch: async (request) => {
      const { response } = await handler.handle(request, {
        prefix: "/api",
        context: {},
      });

      return response ?? new Response(null, { status: 404 });
    },
  });

  expect(await client.images.get(image.id)).toEqual(image);
  expect(await client.series.list()).toEqual([summary]);
  expect(await client.series.get("sea")).toEqual({
    ...series,
    images: [image],
  });
  expect(
    await client.images.get("019b0000-0000-7000-8000-000000000002"),
  ).toBeUndefined();
  expect(await client.series.get("missing")).toBeUndefined();
});

test("ID や slug の形に合わなければ公開 API を呼ばず、CMS の想定外の失敗は投げること", async () => {
  const client = createAnalemmaClient({
    url,
    fetch: () => Promise.reject(new Error("CMS に届かない")),
  });

  expect(await client.images.get("invalid")).toBeUndefined();
  expect(await client.series.get("Bad Slug")).toBeUndefined();
  expect(client.images.get(image.id)).rejects.toThrow("CMS に届かない");
  expect(client.series.get("sea")).rejects.toThrow("CMS に届かない");
});

test("公開サイトの画像の項目で、公開画像と配信用の絶対 URL を検査すること", () => {
  const field = imageField({ label: "写真" });
  const value = { available: true, image } as const;
  expect(field.parse(value)).toEqual(value);
  const relative = { width: 640, height: 320, url: "/photo.avif" };
  expect(
    field.safeParse({
      ...value,
      image: { ...image, deliveryImages: [relative] },
    }).success,
  ).toBe(false);
});
