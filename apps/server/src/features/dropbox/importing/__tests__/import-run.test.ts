import { describe, expect, test } from "bun:test";

import {
  createDropboxImports,
  finishRun,
  type ImportRun,
  toDropboxImport,
  withPhotoStatus,
} from "@/features/dropbox/importing/import-run";

const STARTED_AT = new Date("2026-01-01T00:00:00.000Z");
const FINISHED_AT = new Date("2026-01-01T00:05:00.000Z");
const IMAGE_ID = "019b0000-0000-7000-8000-000000000000";

const run: ImportRun = {
  startedAt: STARTED_AT,
  finishedAt: null,
  photos: [
    { id: "id:a", path: "/a.jpg", status: "waiting", imageId: null },
    { id: "id:b", path: "/b.jpg", status: "waiting", imageId: null },
  ],
};

describe("createDropboxImports", () => {
  test("権利を持つ間と、取り込みを終えるまでは、次の権利を渡さないこと", () => {
    const imports = createDropboxImports();
    const claim = imports.claim();

    expect(imports.claim()).toBeUndefined();

    claim?.begin(run);
    expect(imports.isBusy()).toBe(true);
    expect(imports.claim()).toBeUndefined();

    imports.update(finishRun(FINISHED_AT));
    expect(imports.isBusy()).toBe(false);
    expect(imports.claim()).toBeDefined();
  });

  test("始めずに手放した権利は、すぐに次へ渡すこと", () => {
    const imports = createDropboxImports();

    {
      using claim = imports.claim();

      expect(claim).toBeDefined();
    }

    expect(imports.isBusy()).toBe(false);
    expect(imports.current()).toBeUndefined();
  });
});

describe("withPhotoStatus", () => {
  test("指した写真だけの状態と画像の ID を変えること", () => {
    expect(
      withPhotoStatus(1, { status: "added", imageId: IMAGE_ID })(run).photos,
    ).toEqual([
      { id: "id:a", path: "/a.jpg", status: "waiting", imageId: null },
      { id: "id:b", path: "/b.jpg", status: "added", imageId: IMAGE_ID },
    ]);
  });
});

describe("toDropboxImport", () => {
  test("日時を ISO 8601 にし、終えていなければ null にすること", () => {
    expect(toDropboxImport(run)).toMatchObject({
      startedAt: "2026-01-01T00:00:00.000Z",
      finishedAt: null,
    });
    expect(toDropboxImport(finishRun(FINISHED_AT)(run)).finishedAt).toBe(
      "2026-01-01T00:05:00.000Z",
    );
  });
});
