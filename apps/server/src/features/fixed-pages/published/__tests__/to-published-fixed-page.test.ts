import { expect, test } from "bun:test";

import { toPublishedFixedPage } from "@/features/fixed-pages/published/to-published-fixed-page";

test("入れ子の画像だけを公開用の値に置き換え、固定ページの行には保存した ID を残すこと", () => {
  const id = crypto.randomUUID();
  const now = new Date("2026-01-01T00:00:00.000Z");
  const content = { items: [{ listed: true, photo: id, note: id }] };

  const page = {
    id,
    kind: "gallery",
    slug: "sea",
    title: "海",
    position: 0,
    createdAt: now,
    updatedAt: now,
    publishedAt: now,
    content,
  };

  const fields = [
    {
      type: "repeat",
      key: "items",
      label: "作品",
      fields: [
        { type: "boolean", key: "listed", label: "表示", optional: true },
        { type: "image", key: "photo", label: "写真" },
      ],
    },
  ];

  const published = toPublishedFixedPage(
    { page, fields },
    { images: [], origin: "https://cms.example.com" },
  );

  expect(published.content).toEqual({
    items: [{ listed: true, photo: { available: false }, note: id }],
  });
  expect(page.content.items[0]?.photo).toBe(id);
});
