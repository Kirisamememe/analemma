import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";

import { KINDS_QUERY_KEY } from "@/features/fixed-pages/queries/fixed-pages-query";
import { useLogOut } from "@/features/session/hooks/use-log-out";
import { createTestApp } from "@/testing/create-test-app";
import { withAppProviders } from "@/testing/hook-wrappers";

afterEach(cleanup);

describe("useLogOut", () => {
  test("ログアウトを送り、server の状態を消して、ログインの画面に移る", async () => {
    const app = createTestApp({
      path: "/enroll",
      routes: { "admin/session/logOut": () => ({ output: undefined }) },
    });

    await app.router.load();
    app.queryClient.setQueryData(["passkeys"], []);
    app.queryClient.setQueryData(KINDS_QUERY_KEY, { kinds: [] });

    const { result } = renderHook(useLogOut, {
      wrapper: withAppProviders(app),
    });

    act(() => {
      result.current.mutate();
    });

    await waitFor(() => {
      expect(app.history.location.href).toBe("/login");
    });
    expect(app.calls).toEqual(["admin/session/logOut"]);
    expect(app.queryClient.getQueryData(["passkeys"])).toBeUndefined();
    expect(app.queryClient.getQueryData(KINDS_QUERY_KEY)).toBeUndefined();
  });
});
