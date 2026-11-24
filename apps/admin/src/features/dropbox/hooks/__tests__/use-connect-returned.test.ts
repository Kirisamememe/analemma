import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, mock, test } from "bun:test";

import { useConnectReturned } from "@/features/dropbox/hooks/use-connect-returned";
import type { CallbackSearch } from "@/features/dropbox/logic/callback-search";
import { createTestApp } from "@/testing/create-test-app";
import {
  createDropboxRoutes,
  FAKE_DROPBOX_RETURN,
} from "@/testing/fake-routes/create-dropbox-routes";
import { withAppProviders } from "@/testing/hook-wrappers";

afterEach(cleanup);

const setUp = async (search: CallbackSearch) => {
  const server = createDropboxRoutes();
  const app = createTestApp({ path: "/enroll", routes: server.routes });
  const onConnected = mock(() => undefined);

  await app.router.load();

  const { result } = renderHook(() => useConnectReturned(search, onConnected), {
    wrapper: withAppProviders(app),
  });

  return { result, onConnected };
};

describe("useConnectReturned", () => {
  test("押すまでは送らず、つないだら知らせること", async () => {
    const { result, onConnected } = await setUp({
      _tag: "Approved",
      ...FAKE_DROPBOX_RETURN,
    });

    expect(result.current.state).toBe("Ready");

    act(() => {
      result.current.connect();
    });

    await waitFor(() => {
      expect(onConnected).toHaveBeenCalledTimes(1);
    });
  });

  test("期限を過ぎた state と、許可しなかったことを、その状態で返すこと", async () => {
    const expired = await setUp({
      _tag: "Approved",
      code: FAKE_DROPBOX_RETURN.code,
      state: "old",
    });

    act(() => {
      expired.result.current.connect();
    });

    await waitFor(() => {
      expect(expired.result.current.state).toBe("Expired");
    });

    const denied = await setUp({ _tag: "Denied" });

    expect(denied.result.current.state).toBe("Denied");
  });
});
