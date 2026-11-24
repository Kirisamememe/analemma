import { describe, expect, test } from "bun:test";

import {
  createDropboxImports,
  failRemaining,
  finishRun,
  type ImportRun,
  withPhotoStatus,
} from "@/features/dropbox/importing/import-run";

const STARTED_AT = new Date("2026-01-01T00:00:00.000Z");
const FINISHED_AT = new Date("2026-01-01T00:05:00.000Z");
const IMAGE_ID = "019b0000-0000-7000-8000-000000000000";

const run: ImportRun = {
  startedAt: STARTED_AT,
  finishedAt: null,
  photos: [
    {
      id: "id:a",
      path: "/a.jpg",
      status: "waiting",
      imageId: null,
      contentHash: "hash-a",
    },
    {
      id: "id:b",
      path: "/b.jpg",
      status: "waiting",
      imageId: null,
      contentHash: "hash-b",
    },
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

describe("pause", () => {
  test("手放すまでは、取り込みを始める権利を渡さないこと", () => {
    const imports = createDropboxImports();

    {
      using paused = imports.pause();

      expect(imports.claim()).toBeUndefined();
      expect(imports.isBusy()).toBe(false);
    }

    expect(imports.claim()).toBeDefined();
  });
});

describe("withPhotoStatus", () => {
  test("指した写真だけの状態と画像の ID を変えること", () => {
    expect(
      withPhotoStatus(1, { status: "added", imageId: IMAGE_ID })(
        run,
      ).photos.map(({ status, imageId }) => ({ status, imageId })),
    ).toEqual([
      { status: "waiting", imageId: null },
      { status: "added", imageId: IMAGE_ID },
    ]);
  });
});

const photoOf = (
  id: string,
  status: ImportRun["photos"][number]["status"],
): ImportRun["photos"][number] => ({
  id,
  path: `/${id}.jpg`,
  status,
  imageId: null,
  contentHash: `hash-${id}`,
});

describe("failRemaining", () => {
  test("指した写真と、その後で待っている写真だけを、取り込めなかったことにすること", () => {
    const longer: ImportRun = {
      ...run,
      photos: [
        photoOf("a", "added"),
        photoOf("b", "importing"),
        photoOf("c", "waiting"),
        photoOf("d", "too-large"),
      ],
    };

    expect(failRemaining(1)(longer).photos.map(({ status }) => status)).toEqual(
      ["added", "failed", "failed", "too-large"],
    );
  });
});
