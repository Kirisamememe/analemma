import { describe, expect, test } from "bun:test";

import {
  authorizeDropbox,
  connectDropbox,
  disconnectDropbox,
  startDropboxImport,
} from "@/features/dropbox/queries/dropbox-actions";
import { createFakeApi } from "@/testing/create-fake-api";
import {
  createDropboxRoutes,
  FAKE_DROPBOX_CONNECTED,
  FAKE_DROPBOX_RETURN,
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

const prepare = (seed: FakeDropboxSeed = {}) => {
  const dropbox = createDropboxRoutes(seed);

  return { ...dropbox, api: createFakeApi(dropbox.routes).api };
};

describe("つなぐ", () => {
  test("認可の画面の URL を受け取り、戻った code でつなぐこと", async () => {
    const { api } = prepare();

    expect(await authorizeDropbox(api)).toMatchObject({ _tag: "Opened" });
    expect(await connectDropbox(api, FAKE_DROPBOX_RETURN)).toEqual({
      _tag: "Connected",
      connection: FAKE_DROPBOX_CONNECTED,
    });
    expect(await authorizeDropbox(api)).toEqual({ _tag: "AlreadyConnected" });
  });

  test("設定が無いこと・期限切れ・Dropbox が断ったことを見分けること", async () => {
    expect(
      await authorizeDropbox(
        prepare({ connection: { status: "unconfigured" } }).api,
      ),
    ).toEqual({ _tag: "NotConfigured" });

    const { api } = prepare();

    expect(
      await connectDropbox(api, { ...FAKE_DROPBOX_RETURN, state: "old" }),
    ).toEqual({ _tag: "Expired" });
    expect(
      await connectDropbox(api, { ...FAKE_DROPBOX_RETURN, code: "wrong" }),
    ).toEqual({ _tag: "Rejected" });
  });
});

describe("取り込み", () => {
  test("取り込みの途中は、次の取り込みと切断を断ったと返すこと", async () => {
    const { api } = prepare({
      connection: FAKE_DROPBOX_CONNECTED,
      photos: [PHOTO],
    });

    expect(
      await startDropboxImport(api, [
        { id: "id:a", contentHash: "a".repeat(64) },
      ]),
    ).toMatchObject({
      _tag: "Started",
      run: { finishedAt: null },
    });
    expect(
      await startDropboxImport(api, [
        { id: "id:a", contentHash: "a".repeat(64) },
      ]),
    ).toEqual({
      _tag: "ImportRunning",
    });
    expect(await disconnectDropbox(api)).toBe("ImportRunning");
  });
});
