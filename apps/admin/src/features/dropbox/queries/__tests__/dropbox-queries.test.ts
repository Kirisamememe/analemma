import { describe, expect, test } from "bun:test";

import { loadDropboxPhotos } from "@/features/dropbox/queries/dropbox-queries";
import { createFakeApi } from "@/testing/create-fake-api";
import {
  createDropboxRoutes,
  FAKE_DROPBOX_CONNECTED,
  type FakeDropboxSeed,
} from "@/testing/fake-routes/create-dropbox-routes";

const PHOTO = {
  id: "id:a",
  path: "/a.jpg",
  size: 1000,
  modifiedAt: "2026-03-01T09:00:00.000Z",
  imported: null,
  contentHash: "a".repeat(64),
};

const prepare = (seed: FakeDropboxSeed = {}) =>
  createFakeApi(createDropboxRoutes(seed).routes);

describe("loadDropboxPhotos", () => {
  test("つないでいなければ、写真の一覧の代わりにそう返すこと", async () => {
    expect(await loadDropboxPhotos(prepare({ photos: [PHOTO] }).api)).toEqual({
      _tag: "NotConnected",
    });
    expect(
      await loadDropboxPhotos(
        prepare({ connection: FAKE_DROPBOX_CONNECTED, photos: [PHOTO] }).api,
      ),
    ).toEqual({ _tag: "Listed", photos: [PHOTO] });
  });
});
