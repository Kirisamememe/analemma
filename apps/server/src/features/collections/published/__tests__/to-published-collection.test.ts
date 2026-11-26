import { expect, test } from "bun:test";

import {
  toPublishedCollection,
  toPublishedCollectionList,
} from "@/features/collections/published/to-published-collection";

const fields = { name: "海辺", slug: "sea", description: null };
const origin = "https://cms.example.test";
const date = new Date("2025-01-01T00:00:00Z");

const image = {
  id: "019b0000-0000-7000-8000-000000000001",
  title: null,
  description: null,
  alt: null,
  takenAt: null,
  takenAtOffsetMinutes: null,
  camera: null,
  lens: null,
  focalLength: null,
  fNumber: null,
  exposureTime: null,
  iso: null,
  publishedAt: date,
  createdAt: date,
  updatedAt: date,
};

const deliveries = [1280, 640].map((width) => ({
  imageId: image.id,
  width,
  height: width,
  fileKey: `photo-${width}.avif`,
}));

const empty = { fields, image: null, deliveryImage: null };

test("同じ画像の幅ごとの行をまとめ、公開画像をコレクションの中の並び順で返すこと", () => {
  const second = { ...image, id: "019b0000-0000-7000-8000-000000000002" };

  const rows = deliveries.map((deliveryImage) => ({
    fields,
    image,
    deliveryImage,
  }));

  const collection = toPublishedCollection(
    [empty, ...rows, { fields, image: second, deliveryImage: null }],
    origin,
  );

  expect(collection?.images.map((item) => item.id)).toEqual([
    image.id,
    second.id,
  ]);
  expect(collection?.images[0]?.deliveryImages.map((item) => item.url)).toEqual(
    [
      `${origin}/media/${image.id}/640.avif`,
      `${origin}/media/${image.id}/1280.avif`,
    ],
  );
});

test("公開画像が無いコレクションは空の画像一覧を返し、コレクション自体が無ければ undefined を返すこと", () => {
  expect(toPublishedCollection([empty], origin)).toEqual({
    ...fields,
    images: [],
  });
  expect(toPublishedCollection([], origin)).toBeUndefined();
});

test("一覧ではコレクションごとにカバーと件数を返し、公開画像が無ければカバーは null になること", () => {
  const sky = { name: "空", slug: "sky", description: "夏の記録" };

  const list = toPublishedCollectionList(
    [
      ...deliveries.map((deliveryImage) => ({
        fields,
        image,
        deliveryImage,
        imageCount: 3,
      })),
      { ...empty, fields: sky, imageCount: 0 },
    ],
    origin,
  );

  expect(list.collections).toMatchObject([
    {
      ...fields,
      imageCount: 3,
      coverImage: {
        id: image.id,
        deliveryImages: [{ width: 640 }, { width: 1280 }],
      },
    },
    { ...sky, imageCount: 0, coverImage: null },
  ]);
});
