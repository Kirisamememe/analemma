import { QueryClient, focusManager } from "@tanstack/react-query";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";

import { useApiQuery } from "@/api/server-state/server-state";
import { withQueryClient } from "@/testing/hook-wrappers";

afterEach(cleanup);

const KEY = ["admin", "passkeys", "list"] as const;

describe("useApiQuery の取り直し", () => {
  test("失敗した後に取り直す間は、失敗のまま取り直していることを返し、取れたらデータを返す", async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    const retried = Promise.withResolvers<string[]>();
    let fetches = 0;

    const { result } = renderHook(
      () =>
        useApiQuery({
          key: KEY,
          load: () => {
            fetches += 1;

            return fetches === 1
              ? Promise.reject(new Error("取得できない"))
              : retried.promise;
          },
        }),
      { wrapper: withQueryClient(client) },
    );

    await waitFor(() => {
      expect(result.current).toMatchObject({ _tag: "Failed" });
    });

    act(() => {
      if (result.current._tag === "Failed") result.current.retry();
    });

    await waitFor(() => {
      expect(result.current).toMatchObject({
        _tag: "Failed",
        isRetrying: true,
      });
    });

    retried.resolve(["MacBook"]);

    await waitFor(() => {
      expect(result.current).toEqual({ _tag: "Loaded", data: ["MacBook"] });
    });
    expect(fetches).toBe(2);
  });

  test("取り直しも失敗したら、取り直していない失敗に戻る", async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    const retried = Promise.withResolvers<string[]>();
    let fetches = 0;

    const { result } = renderHook(
      () =>
        useApiQuery({
          key: KEY,
          load: () => {
            fetches += 1;

            return fetches === 1
              ? Promise.reject(new Error("取得できない"))
              : retried.promise;
          },
        }),
      { wrapper: withQueryClient(client) },
    );

    await waitFor(() => {
      expect(result.current).toMatchObject({ _tag: "Failed" });
    });

    act(() => {
      if (result.current._tag === "Failed") result.current.retry();
    });

    await waitFor(() => {
      expect(result.current).toMatchObject({
        _tag: "Failed",
        isRetrying: true,
      });
    });

    retried.reject(new Error("取り直しても取得できない"));

    await waitFor(() => {
      expect(result.current).toMatchObject({
        _tag: "Failed",
        isRetrying: false,
      });
    });
    expect(fetches).toBe(2);
  });

  test("取り直しが、画面が隠れて次の試行を待つ間も、取り直していることを返す", async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: 1, retryDelay: 0 } },
    });

    const retried = Promise.withResolvers<string[]>();
    let fetches = 0;

    const { result } = renderHook(
      () =>
        useApiQuery({
          key: KEY,
          load: () => {
            fetches += 1;

            return fetches <= 3
              ? Promise.reject(new Error("取得できない"))
              : retried.promise;
          },
        }),
      { wrapper: withQueryClient(client) },
    );

    try {
      await waitFor(() => {
        expect(result.current).toMatchObject({
          _tag: "Failed",
          isRetrying: false,
        });
      });

      focusManager.setFocused(false);
      act(() => {
        if (result.current._tag === "Failed") result.current.retry();
      });

      await waitFor(() => {
        expect(fetches).toBe(3);
      });
      await new Promise<void>((resolve) => {
        setTimeout(resolve, 20);
      });

      expect(result.current).toMatchObject({
        _tag: "Failed",
        isRetrying: true,
      });

      focusManager.setFocused(true);
      retried.resolve(["MacBook"]);

      await waitFor(() => {
        expect(result.current).toEqual({ _tag: "Loaded", data: ["MacBook"] });
      });
    } finally {
      focusManager.setFocused(undefined);
    }
  });
});
