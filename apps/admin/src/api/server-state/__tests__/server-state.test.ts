import { ORPCError } from "@orpc/client";
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

  test("取得済みのデータを取り直して同じ内容が届いても、読む側を再レンダリングしない", async () => {
    const client = new QueryClient();
    let loads = 0;
    let renders = 0;
    let pending = Promise.resolve(["MacBook"]);

    const { result } = renderHook(
      () => {
        renders += 1;

        return useApiQuery({
          key: KEY,
          load: () => {
            loads += 1;

            return pending;
          },
        });
      },
      { wrapper: withQueryClient(client) },
    );

    await waitFor(() => {
      expect(result.current).toEqual({ _tag: "Loaded", data: ["MacBook"] });
    });

    const rendered = renders;
    const again = Promise.withResolvers<string[]>();

    pending = again.promise;

    const reloaded = client.refetchQueries({ queryKey: KEY });

    await waitFor(() => {
      expect(client.isFetching({ queryKey: KEY })).toBe(1);
    });
    await act(async () => {
      again.resolve(["MacBook"]);
      await reloaded;
    });

    expect(loads).toBe(2);
    expect(renders).toBe(rendered);
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
      expect(result.current).toMatchObject({
        _tag: "Failed",
        isRetrying: false,
      });
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
      expect(result.current.query).toMatchObject({
        _tag: "Failed",
        isRetrying: false,
      });
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

  test("画面を開き直しても、同じ画像への次の送信は前の送信の完了を待つ", async () => {
    const finish = Promise.withResolvers<undefined>();
    const wrapper = withQueryClient(new QueryClient());
    const sent: string[] = [];

    const start = () =>
      renderHook(
        () =>
          useApiMutation({
            scope: "image:1",
            send: async (title: string) => {
              sent.push(title);

              if (title === "朝の山") await finish.promise;
            },
            onSuccess: () => undefined,
          }),
        { wrapper },
      );

    const first = start();
    act(() => {
      first.result.current.mutate("朝の山");
    });
    await waitFor(() => {
      expect(sent).toEqual(["朝の山"]);
    });
    first.unmount();
    const second = start();
    act(() => {
      second.result.current.mutate("夕方の山");
    });
    await waitFor(() => {
      expect(second.result.current.isPending).toBe(true);
    });
    expect(sent).toEqual(["朝の山"]);
    finish.resolve(undefined);
    await waitFor(() => {
      expect(sent).toEqual(["朝の山", "夕方の山"]);
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

  test("想定外の失敗では onError を呼び、セッション切れでは呼ばない", async () => {
    let errors = 0;

    const { result } = renderHook(
      () =>
        useApiMutation({
          send: (failure: Error) => Promise.reject(failure),
          onSuccess: () => undefined,
          onError: () => {
            errors += 1;
          },
        }),
      { wrapper: withQueryClient(new QueryClient()) },
    );

    act(() => {
      result.current.mutate(new ORPCError("UNAUTHORIZED"));
    });
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
    expect(errors).toBe(0);

    act(() => {
      result.current.mutate(new Error("操作できない"));
    });
    await waitFor(() => {
      expect(errors).toBe(1);
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

  test("一覧の初回取得中に変更が届いても、取得をやり直して最新の一覧を出す", async () => {
    const first = Promise.withResolvers<string[]>();
    let reads = 0;

    const { result } = renderHook(
      () => ({
        query: useApiQuery({
          key: KEY,
          load: () => {
            reads += 1;
            return reads === 1 ? first.promise : Promise.resolve(["夕方の山"]);
          },
        }),
        cache: useApiCache(),
      }),
      { wrapper: withQueryClient(new QueryClient()) },
    );

    expect(result.current.query._tag).toBe("Loading");
    await act(async () => {
      await result.current.cache.update<string[]>(KEY, (names) =>
        names.slice(1),
      );
      first.resolve(["朝の山"]);
    });
    await waitFor(() => {
      expect(result.current.query).toEqual({
        _tag: "Loaded",
        data: ["夕方の山"],
      });
    });
    expect(reads).toBe(2);
  });

  test("使う画面が無い取得も取り直し、開き直したときに取り直した値を出す", async () => {
    const client = new QueryClient();
    let list = ["MacBook"];
    const load = () => Promise.resolve(list);

    const first = renderHook(() => useApiQuery({ key: KEY, load }), {
      wrapper: withQueryClient(client),
    });

    await waitFor(() => {
      expect(first.result.current).toEqual({
        _tag: "Loaded",
        data: ["MacBook"],
      });
    });
    first.unmount();
    list = ["iPhone"];

    const { result } = renderHook(useApiCache, {
      wrapper: withQueryClient(client),
    });

    await act(async () => {
      await result.current.refresh(KEY);
    });

    const reopened = renderHook(() => useApiQuery({ key: KEY, load }), {
      wrapper: withQueryClient(client),
    });

    expect(reopened.result.current).toEqual({
      _tag: "Loaded",
      data: ["iPhone"],
    });
  });

  test("送っている取得を中断し、取り直さずにデータを差し替える", async () => {
    const pending = Promise.withResolvers<string[]>();
    let fetches = 0;

    const { result } = renderHook(
      () => ({
        query: useApiQuery({
          key: KEY,
          load: () => {
            fetches += 1;

            return fetches === 1
              ? Promise.resolve(["MacBook"])
              : pending.promise;
          },
        }),
        cache: useApiCache(),
      }),
      { wrapper: withQueryClient(new QueryClient()) },
    );

    await waitFor(() => {
      expect(result.current.query).toEqual({
        _tag: "Loaded",
        data: ["MacBook"],
      });
    });
    void result.current.cache.refresh(KEY);
    await waitFor(() => {
      expect(fetches).toBe(2);
    });
    await act(async () => {
      await result.current.cache.replace(KEY, ["iPhone"]);
    });
    await act(async () => {
      pending.resolve(["古い一覧"]);
      await new Promise<void>((resolve) => {
        setTimeout(resolve, 0);
      });
    });

    expect(result.current.query).toEqual({
      _tag: "Loaded",
      data: ["iPhone"],
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
