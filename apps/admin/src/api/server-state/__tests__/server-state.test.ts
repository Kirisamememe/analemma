import { QueryClient } from "@tanstack/react-query";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";

import {
  useApiCache,
  useApiMutation,
  useApiQuery,
} from "@/api/server-state/server-state";
import { withQueryClient } from "@/testing/hook-wrappers";

afterEach(cleanup);

const KEY = ["admin", "passkeys", "list"] as const;

describe("useApiQuery", () => {
  test("読み込み中の後、取得したデータを返す", async () => {
    const response = Promise.withResolvers<string[]>();
    const { result } = renderHook(
      () => useApiQuery({ key: KEY, load: () => response.promise }),
      { wrapper: withQueryClient(new QueryClient()) },
    );

    expect(result.current).toEqual({ _tag: "Loading" });
    response.resolve(["MacBook"]);

    await waitFor(() => {
      expect(result.current).toEqual({ _tag: "Loaded", data: ["MacBook"] });
    });
  });

  test("最初の取得が失敗したことを返す", async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const { result } = renderHook(
      () =>
        useApiQuery({
          key: KEY,
          load: () => Promise.reject(new Error("取得できない")),
        }),
      { wrapper: withQueryClient(client) },
    );

    await waitFor(() => {
      expect(result.current).toEqual({ _tag: "Failed" });
    });
  });

  test("再取得が失敗したら、前のデータの代わりに失敗を返す", async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    let fetches = 0;
    const { result } = renderHook(
      () => ({
        query: useApiQuery({
          key: KEY,
          load: () => {
            fetches += 1;

            return fetches === 1
              ? Promise.resolve(["MacBook"])
              : Promise.reject(new Error("再取得できない"));
          },
        }),
        cache: useApiCache(),
      }),
      { wrapper: withQueryClient(client) },
    );

    await waitFor(() => {
      expect(result.current.query).toEqual({
        _tag: "Loaded",
        data: ["MacBook"],
      });
    });

    await act(async () => {
      await result.current.cache.refresh(KEY);
    });

    await waitFor(() => {
      expect(result.current.query).toEqual({ _tag: "Failed" });
    });
  });
});

describe("useApiMutation", () => {
  test("成功後の処理が終わるまで送信中のままにし、reset で結果を消す", async () => {
    const afterSuccess = Promise.withResolvers<undefined>();
    const saved = Promise.withResolvers<string>();
    const { result } = renderHook(
      () =>
        useApiMutation({
          send: (name: string) => Promise.resolve({ name }),
          onSuccess: ({ name }) => {
            saved.resolve(name);

            return afterSuccess.promise;
          },
        }),
      { wrapper: withQueryClient(new QueryClient()) },
    );

    act(() => {
      result.current.mutate("MacBook");
    });

    expect(await saved.promise).toBe("MacBook");

    await waitFor(() => {
      expect(result.current.isPending).toBe(true);
    });
    expect(result.current.data).toBeUndefined();

    afterSuccess.resolve(undefined);
    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
      expect(result.current.data).toEqual({ name: "MacBook" });
    });

    act(() => {
      result.current.reset();
    });

    await waitFor(() => {
      expect(result.current.data).toBeUndefined();
    });
  });

  test("引数なしで送れ、失敗したことを返す", async () => {
    const { result } = renderHook(
      () =>
        useApiMutation({
          send: () => Promise.reject(new Error("操作できない")),
          onSuccess: () => undefined,
        }),
      { wrapper: withQueryClient(new QueryClient()) },
    );

    act(() => {
      result.current.mutate();
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
      expect(result.current.isPending).toBe(false);
    });
  });
});

describe("useApiCache", () => {
  test("操作の前に送った最初の取得が遅れて届いても、操作の後の一覧を出す", async () => {
    const first = Promise.withResolvers<string[]>();
    let fetches = 0;
    const { result } = renderHook(
      () => ({
        query: useApiQuery({
          key: KEY,
          load: () => {
            fetches += 1;

            return fetches === 1
              ? first.promise
              : Promise.resolve(["MacBook", "iPhone"]);
          },
        }),
        cache: useApiCache(),
      }),
      { wrapper: withQueryClient(new QueryClient()) },
    );

    expect(result.current.query).toEqual({ _tag: "Loading" });
    expect(fetches).toBe(1);

    await act(async () => {
      await result.current.cache.refresh(KEY);
      first.resolve(["MacBook"]);
    });

    await waitFor(() => {
      expect(result.current.query).toEqual({
        _tag: "Loaded",
        data: ["MacBook", "iPhone"],
      });
    });
  });

  test("取得と送信のキャッシュを消す", async () => {
    const client = new QueryClient();
    client.setQueryData(KEY, ["MacBook"]);
    await client
      .getMutationCache()
      .build(client, {
        mutationFn: () => Promise.resolve("完了"),
      })
      .execute(undefined);
    const { result } = renderHook(useApiCache, {
      wrapper: withQueryClient(client),
    });

    act(() => {
      result.current.clear();
    });

    expect(client.getQueryData(KEY)).toBeUndefined();
    expect(client.getMutationCache().getAll()).toEqual([]);
  });
});
