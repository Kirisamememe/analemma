import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";

import { useDropboxImport } from "@/features/dropbox/hooks/use-dropbox-import";
import {
  DROPBOX_PHOTOS_KEY,
  type DropboxPhoto,
  type DropboxPhotos,
} from "@/features/dropbox/queries/dropbox-queries";
import { createTestApp } from "@/testing/create-test-app";
import {
  createDropboxRoutes,
  FAKE_DROPBOX_CONNECTED,
} from "@/testing/fake-routes/create-dropbox-routes";
import { withAppProviders } from "@/testing/hook-wrappers";

afterEach(cleanup);

const AT = "2026-03-01T09:00:00.000Z";

const photo = (id: string, imported = false): DropboxPhoto => ({
  id,
  path: `/${id.slice(3)}.jpg`,
  size: 1000,
  modifiedAt: AT,
  imported: imported ? { imageId: null, importedAt: AT } : null,
  contentHash: "a".repeat(64),
});

const setUp = async () => {
  const photos = [photo("id:a"), photo("id:b"), photo("id:old", true)];

  const server = createDropboxRoutes({
    connection: FAKE_DROPBOX_CONNECTED,
    photos,
  });

  const app = createTestApp({ path: "/enroll", routes: server.routes });

  await app.router.load();

  const listed: DropboxPhotos = { _tag: "Listed", photos };

  app.queryClient.setQueryData(DROPBOX_PHOTOS_KEY, listed);

  const { result } = renderHook(useDropboxImport, {
    wrapper: withAppProviders(app),
  });

  return { server, result };
};

describe("useDropboxImport", () => {
  test("まだ取り込んでいない写真を数え、取り込みを始めたら途中の数を返すこと", async () => {
    const { server, result } = await setUp();

    await waitFor(() => {
      expect(result.current.importable.map(({ id }) => id)).toEqual([
        "id:a",
        "id:b",
      ]);
    });
    expect(result.current.importedCount).toBe(1);
    expect(result.current.counts).toBeUndefined();

    act(() => {
      result.current.start();
    });

    await waitFor(() => {
      expect(result.current.running).toBe(true);
    });
    expect(result.current.counts).toEqual({
      total: 2,
      done: 0,
      added: 0,
      failed: 0,
    });
    expect(result.current.importable).toEqual([]);

    server.advance();
    server.advance();

    await waitFor(
      () => {
        expect(result.current.running).toBe(false);
      },
      { timeout: 3000 },
    );
    expect(result.current.counts).toMatchObject({ done: 2, added: 2 });
  });
});
