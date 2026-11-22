import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";

import { useAppContext, useGoToLogin } from "@/api/app-context";
import { createTestApp } from "@/testing/create-test-app";
import { withRouter } from "@/testing/hook-wrappers";

afterEach(cleanup);

describe("useAppContext", () => {
  test("root route と同じ API・認証器・gate を返す", async () => {
    const { router } = createTestApp({ path: "/enroll", routes: {} });
    await router.load();

    const { result } = renderHook(useAppContext, {
      wrapper: withRouter(router),
    });
    const { api, authenticator, gate } = router.options.context;

    expect(result.current.api).toBe(api);
    expect(result.current.authenticator).toBe(authenticator);
    expect(result.current.gate).toBe(gate);
  });
});

describe("useGoToLogin", () => {
  test("search を引き継がずに、ログインの画面に移る", async () => {
    const { history, router } = createTestApp({
      path: "/enroll?redirect=%2Fsecurity",
      routes: {},
    });
    await router.load();

    const { result } = renderHook(useGoToLogin, {
      wrapper: withRouter(router),
    });

    act(() => {
      result.current();
    });

    await waitFor(() => {
      expect(history.location.href).toBe("/login");
    });
  });
});
