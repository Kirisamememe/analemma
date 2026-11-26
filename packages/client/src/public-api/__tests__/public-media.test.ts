import { implement } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";
import { expect, test } from "bun:test";

import { contract } from "@analemma/contract";

import { createAnalemmaClient } from "../../index";

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

const collection = { name: "海辺", slug: "sea", description: null };
const summary = { ...collection, imageCount: 1, coverImage: image };
const url = "http://127.0.0.1:8788";

test("公開している画像とコレクションを取得し、無いときは undefined を返すこと", async () => {
  const os = implement({
    public: {
      images: contract.public.images,
      collections: contract.public.collections,
    },
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
        collections: {
          get: os.public.collections.get.handler(({ input, errors }) => {
            if (input.slug !== collection.slug) throw errors.NOT_FOUND();

            return { ...collection, images: [image] };
          }),
          list: os.public.collections.list.handler(() => ({
            collections: [summary],
          })),
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
  expect(await client.collections.list()).toEqual([summary]);
  expect(await client.collections.get("sea")).toEqual({
    ...collection,
    images: [image],
  });
  expect(
    await client.images.get("019b0000-0000-7000-8000-000000000002"),
  ).toBeUndefined();
  expect(await client.collections.get("missing")).toBeUndefined();
});

test("ID や slug の形に合わなければ公開 API を呼ばず、CMS の想定外の失敗は投げること", async () => {
  const client = createAnalemmaClient({
    url,
    fetch: () => Promise.reject(new Error("CMS に届かない")),
  });

  expect(await client.images.get("invalid")).toBeUndefined();
  expect(await client.collections.get("Bad Slug")).toBeUndefined();
  expect(client.images.get(image.id)).rejects.toThrow("CMS に届かない");
  expect(client.collections.get("sea")).rejects.toThrow("CMS に届かない");
});
