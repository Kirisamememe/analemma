import { describe, expect, test } from "bun:test";

import {
  type FolderPhoto,
  planImport,
} from "@/features/dropbox/importing/plan-import";

const NOW = new Date("2026-01-01T00:00:00.000Z");

const photo = (id: string, change: Partial<FolderPhoto> = {}): FolderPhoto => ({
  id,
  path: `/${id.slice(3)}.jpg`,
  size: 1000,
  contentHash: `hash-${id}`,
  ...change,
});

const plan = (ids: string[], photos: FolderPhoto[]) =>
  planImport({
    selected: ids.map((id) => ({ id, contentHash: `hash-${id}` })),
    photos,
    imported: new Map(),
    maxBytes: 1000,
    now: NOW,
  });

describe("planImport", () => {
  test("選んだ順に、新しい写真を待たせ、大きすぎる・無い・変わった写真を読まずに終えること", () => {
    const { photos } = plan(
      ["id:b", "id:a", "id:big", "id:gone", "id:edited", "id:a"],
      [
        photo("id:a"),
        photo("id:b", { size: 1000 }),
        photo("id:big", { size: 1001 }),
        photo("id:edited", { contentHash: "hash-new" }),
      ],
    );

    expect(photos.map(({ id, status }) => `${id}:${status}`)).toEqual([
      "id:b:waiting",
      "id:a:waiting",
      "id:big:too-large",
      "id:gone:not-found",
      "id:edited:changed",
    ]);
    expect(photos.find(({ id }) => id === "id:gone")).toMatchObject({
      path: "",
      contentHash: null,
    });
  });
});
