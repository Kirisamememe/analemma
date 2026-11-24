import { describe, expect, test } from "bun:test";

import { DROPBOX_IMPORT_MAX_PHOTOS } from "@analemma/contract";

import {
  countRun,
  isImporting,
  listImportable,
  takeImportBatch,
  toPhotoRow,
} from "@/features/dropbox/logic/photo-rows";
import type {
  DropboxImport,
  DropboxPhoto,
} from "@/features/dropbox/queries/dropbox-queries";

const IMAGE_ID = "019b0000-0000-7000-8000-000000000000";
const AT = "2026-01-01T00:00:00.000Z";

const photo = (
  id: string,
  imported: DropboxPhoto["imported"] = null,
): DropboxPhoto => ({
  id,
  path: `/${id.slice(3)}.jpg`,
  size: 1000,
  modifiedAt: AT,
  imported,
  contentHash: "a".repeat(64),
});

const run = (
  photos: DropboxImport["photos"],
  finishedAt: string | null = null,
): DropboxImport => ({ startedAt: AT, finishedAt, photos });

type RunStatus = DropboxImport["photos"][number]["status"];

const runPhoto = (id: string, status: RunStatus) => ({
  id,
  path: `/${id.slice(3)}.jpg`,
  status,
  imageId: status === "added" || status === "already-added" ? IMAGE_ID : null,
});

describe("toPhotoRow", () => {
  test("取り込みの中の写真は、取り込みの状態と作った画像を出すこと", () => {
    expect(toPhotoRow(photo("id:a"), runPhoto("id:a", "added"))).toMatchObject({
      status: "added",
      imageId: IMAGE_ID,
    });
  });

  test("取り込みの外の写真は、取り込んだ記録から、新しいか取り込み済みかを出すこと", () => {
    expect(toPhotoRow(photo("id:a"), undefined).status).toBe("new");
    expect(
      toPhotoRow(
        photo("id:a", { imageId: IMAGE_ID, importedAt: AT }),
        undefined,
      ),
    ).toMatchObject({ status: "imported", imageId: IMAGE_ID });
    expect(
      toPhotoRow(photo("id:a", { imageId: null, importedAt: AT }), undefined)
        .status,
    ).toBe("image-deleted");
  });
});

describe("takeImportBatch", () => {
  test("上限より多い写真は、一覧の順に上限の枚数までを送ること", () => {
    const importable = Array.from(
      { length: DROPBOX_IMPORT_MAX_PHOTOS + 1 },
      (_, index) => ({ id: `id:${index}`, contentHash: "a".repeat(64) }),
    );

    const batch = takeImportBatch(importable);

    expect(batch).toHaveLength(DROPBOX_IMPORT_MAX_PHOTOS);
    expect(batch.at(-1)?.id).toBe(`id:${DROPBOX_IMPORT_MAX_PHOTOS - 1}`);
  });
});

describe("listImportable", () => {
  test("まだ取り込んでいない写真と、取り込めなかった写真だけを、一覧の順に返すこと", () => {
    const photos = [
      photo("id:new"),
      photo("id:done", { imageId: IMAGE_ID, importedAt: AT }),
      photo("id:added"),
      photo("id:failed"),
      photo("id:large"),
      photo("id:waiting"),
    ];

    expect(
      listImportable(
        photos,
        run(
          [
            runPhoto("id:added", "added"),
            runPhoto("id:failed", "failed"),
            runPhoto("id:large", "too-large"),
            runPhoto("id:waiting", "waiting"),
          ],
          AT,
        ),
      ),
    ).toEqual([
      { id: "id:new", contentHash: "a".repeat(64) },
      { id: "id:failed", contentHash: "a".repeat(64) },
    ]);
  });
});

describe("countRun と isImporting", () => {
  test("終えた数・足した数・取り込めなかった数を数え、終えるまでは途中とすること", () => {
    const current = run([
      runPhoto("id:a", "added"),
      runPhoto("id:b", "importing"),
      runPhoto("id:c", "too-large"),
      runPhoto("id:d", "already-added"),
    ]);

    expect(countRun(current)).toEqual({
      total: 4,
      done: 3,
      added: 1,
      failed: 1,
    });
    expect(isImporting(current)).toBe(true);
    expect(isImporting(run(current.photos, AT))).toBe(false);
    expect(isImporting(null)).toBe(false);
  });
});
