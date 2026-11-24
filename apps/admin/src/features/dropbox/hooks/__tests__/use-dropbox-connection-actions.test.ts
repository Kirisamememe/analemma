import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, mock, test } from "bun:test";

import { useDropboxConnectionActions } from "@/features/dropbox/hooks/use-dropbox-connection-actions";
import { createTestApp } from "@/testing/create-test-app";
import {
  createDropboxRoutes,
  FAKE_DROPBOX_CONNECTED,
  type FakeDropboxSeed,
} from "@/testing/fake-routes/create-dropbox-routes";
import { withAppProviders } from "@/testing/hook-wrappers";

afterEach(cleanup);

const setUp = async (seed: FakeDropboxSeed) => {
  const server = createDropboxRoutes(seed);
  const app = createTestApp({ path: "/enroll", routes: server.routes });
  const navigate = mock(() => undefined);

  await app.router.load();

  const { result } = renderHook(() => useDropboxConnectionActions(navigate), {
    wrapper: withAppProviders(app),
  });

  return { result, navigate };
};

describe("useDropboxConnectionActions", () => {
  test("つなぐ操作で、server が作った認可の画面の URL へ移ること", async () => {
    const { result, navigate } = await setUp({});

    act(() => {
      result.current.open();
    });

    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith(
        "https://www.dropbox.com/oauth2/authorize?state=fake-state",
      );
    });
    expect(result.current.failure).toBeUndefined();
  });

  test("設定が無いときと、取り込みの途中に切ろうとしたときは、その理由を返すこと", async () => {
    const unconfigured = await setUp({
      connection: { status: "unconfigured" },
    });

    act(() => {
      unconfigured.result.current.open();
    });

    await waitFor(() => {
      expect(unconfigured.result.current.failure).toBe("NotConfigured");
    });

    const running = await setUp({
      connection: FAKE_DROPBOX_CONNECTED,
      run: {
        startedAt: "2026-03-01T09:10:00.000Z",
        finishedAt: null,
        photos: [],
      },
    });

    act(() => {
      running.result.current.disconnect();
    });

    await waitFor(() => {
      expect(running.result.current.failure).toBe("ImportRunning");
    });
  });
});
