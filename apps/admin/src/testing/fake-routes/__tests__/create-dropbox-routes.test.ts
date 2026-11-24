import { describe, expect, test } from "bun:test";

import { createFakeApi } from "@/testing/create-fake-api";
import {
  createDropboxRoutes,
  FAKE_DROPBOX_CONNECTED,
} from "@/testing/fake-routes/create-dropbox-routes";

const PHOTO = {
  id: "id:a",
  path: "/a.jpg",
  size: 1000,
  modifiedAt: "2026-03-01T09:00:00.000Z",
  imported: null,
  contentHash: "a".repeat(64),
};

describe("createDropboxRoutes", () => {
  test("advance のたびに、待っている先頭の写真を足し、すべて足したら終えること", async () => {
    const dropbox = createDropboxRoutes({
      connection: FAKE_DROPBOX_CONNECTED,
      photos: [PHOTO, { ...PHOTO, id: "id:b", path: "/b.jpg" }],
    });

    const { api } = createFakeApi(dropbox.routes);

    await api.admin.dropbox.startImport({
      photos: [
        { id: "id:a", contentHash: "a".repeat(64) },
        { id: "id:b", contentHash: "a".repeat(64) },
      ],
    });
    dropbox.advance();

    expect(
      (await api.admin.dropbox.getImport())?.photos.map(({ status }) => status),
    ).toEqual(["added", "waiting"]);

    dropbox.advance();

    expect((await api.admin.dropbox.getImport())?.finishedAt).not.toBeNull();
  });
});
