import { describe, expect, test } from "bun:test";

import {
  type FolderPhoto,
  planImport,
} from "@/features/dropbox/importing/plan-import";

const NOW = new Date("2026-01-01T00:00:00.000Z");
const IMAGE_ID = "019b0000-0000-7000-8000-000000000000";

const photo = (id: string, change: Partial<FolderPhoto> = {}): FolderPhoto => ({
  id,
  path: `/${id.slice(3)}.jpg`,
  size: 1000,
  contentHash: `hash-${id}`,
  ...change,
});

const plan = (ids: string[], photos: FolderPhoto[]) =>
  planImport({ ids, photos, imported: new Map(), maxBytes: 1000, now: NOW });

describe("planImport", () => {
  test("選んだ順に並べ、新しい写真を待たせること", () => {
    expect(plan(["id:b", "id:a"], [photo("id:a"), photo("id:b")])).toEqual({
      startedAt: NOW,
      finishedAt: null,
      photos: [
        { id: "id:b", path: "/b.jpg", status: "waiting", imageId: null },
        { id: "id:a", path: "/a.jpg", status: "waiting", imageId: null },
      ],
    });
  });

  test("同じ中身を取り込み済みの写真は、作った画像の ID を持たせて終えること", () => {
    const { photos } = planImport({
      ids: ["id:a", "id:b"],
      photos: [photo("id:a"), photo("id:b")],
      imported: new Map([
        ["hash-id:a", IMAGE_ID],
        ["hash-id:b", null],
      ]),
      maxBytes: 1000,
      now: NOW,
    });

    expect(photos.map(({ status, imageId }) => ({ status, imageId }))).toEqual([
      { status: "already-added", imageId: IMAGE_ID },
      { status: "already-added", imageId: null },
    ]);
  });

  test("上限を超える写真は大きすぎるとし、上限ちょうどは待たせること", () => {
    const { photos } = plan(
      ["id:a", "id:b"],
      [photo("id:a", { size: 1000 }), photo("id:b", { size: 1001 })],
    );

    expect(photos.map(({ status }) => status)).toEqual([
      "waiting",
      "too-large",
    ]);
  });

  test("App folder に無い写真は、パスを空にして無いとすること", () => {
    expect(plan(["id:gone"], [photo("id:a")]).photos).toEqual([
      { id: "id:gone", path: "", status: "not-found", imageId: null },
    ]);
  });

  test("同じ ID を重ねて選んでも、1枚として扱うこと", () => {
    expect(
      plan(["id:a", "id:a"], [photo("id:a")]).photos.map(({ id }) => id),
    ).toEqual(["id:a"]);
  });
});
