import { focusManager, QueryClient } from "@tanstack/react-query";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";

import { useApiCache } from "@/api/server-state/server-state";
import { useApiInfiniteQuery } from "@/api/server-state/use-api-infinite-query";
import { withQueryClient } from "@/testing/hook-wrappers";

afterEach(cleanup);

const KEY = ["admin", "images", "list"] as const;

type Page = {
  /** ページの中身。 */
  readonly items: readonly number[];
  /** 次のページの cursor。 */
  readonly next: string | undefined;
};

const PAGES: Readonly<Record<string, Page>> = {
  first: { items: [1, 2], next: "2" },
  "2": { items: [3, 4], next: "4" },
  "4": { items: [5], next: undefined },
};

const client = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false } } });

const render = (
  load: (cursor: string | undefined) => Promise<Page>,
  queryClient = client(),
) =>
  renderHook(
    () =>
      useApiInfiniteQuery({ key: KEY, load, next: (page: Page) => page.next }),
    { wrapper: withQueryClient(queryClient) },
  );

const loadPage = (cursor: string | undefined): Promise<Page> => {
  const page = PAGES[cursor ?? "first"];

  return page === undefined
    ? Promise.reject(new Error("無いページ"))
    : Promise.resolve(page);
};

type Rendered = ReturnType<typeof render>["result"];

const items = (result: Rendered) =>
  result.current._tag === "Loaded"
    ? result.current.pages.flatMap((page) => page.items)
    : [];

const nextOf = (result: Rendered) =>
  result.current._tag === "Loaded" ? result.current.next : undefined;

const nextToLoad = (result: Rendered) => {
  const next = nextOf(result);

  if (next?._tag !== "Available") throw new Error("続きを読めません");

  return next.load;
};

const nextToRetry = (result: Rendered) => {
  const next = nextOf(result);

  if (next?._tag !== "Failed") throw new Error("続きの失敗がありません");

  return next.retry;
};

describe("useApiInfiniteQuery", () => {
  test("最初のページを読み、続きを足していき、最後のページで続きを無くす", async () => {
    const { result } = render(loadPage);

    expect(result.current).toEqual({ _tag: "Loading" });
    await waitFor(() => {
      expect(items(result)).toEqual([1, 2]);
    });

    for (const expected of [
      [1, 2, 3, 4],
      [1, 2, 3, 4, 5],
    ]) {
      act(nextToLoad(result));
      await waitFor(() => {
        expect(items(result)).toEqual(expected);
      });
    }

    expect(result.current).toMatchObject({ next: { _tag: "None" } });
  });

  test("続きの失敗後も一覧の取り直しを待つ間は読んだページを残し、新しい内容から続きを読める", async () => {
    const queryClient = client();
    const refreshed = Promise.withResolvers<Page>();
    let refreshFirstPage = false;

    const { result } = render((cursor) => {
      if (cursor === undefined && refreshFirstPage) return refreshed.promise;

      if (cursor !== undefined && !refreshFirstPage) {
        return Promise.reject(new Error("続きが読めない"));
      }

      return loadPage(cursor);
    }, queryClient);

    await waitFor(() => {
      expect(items(result)).toEqual([1, 2]);
    });

    act(nextToLoad(result));
    await waitFor(() => {
      expect(nextOf(result)?._tag).toBe("Failed");
    });
    const retry = nextToRetry(result);

    refreshFirstPage = true;
    const refreshing = queryClient.invalidateQueries({ queryKey: KEY });

    await waitFor(() => {
      expect(nextOf(result)).toMatchObject({
        _tag: "Failed",
        isRetrying: true,
      });
    });
    expect(items(result)).toEqual([1, 2]);
    act(retry);
    refreshed.resolve({ items: [2, 3], next: "4" });
    await refreshing;
    await waitFor(() => {
      expect(items(result)).toEqual([2, 3]);
    });

    act(nextToLoad(result));
    await waitFor(() => {
      expect(items(result)).toEqual([2, 3, 5]);
    });
  });

  test("ページの番号を見て、先頭のページだけを変えられる", async () => {
    const { result } = renderHook(
      () => ({
        query: useApiInfiniteQuery({
          key: KEY,
          load: loadPage,
          next: (page: Page) => page.next,
        }),
        cache: useApiCache(),
      }),
      { wrapper: withQueryClient(client()) },
    );

    await waitFor(() => {
      expect(result.current.query._tag).toBe("Loaded");
    });
    act(() => {
      if (
        result.current.query._tag === "Loaded" &&
        result.current.query.next._tag === "Available"
      ) {
        result.current.query.next.load();
      }
    });
    await waitFor(() => {
      expect(
        result.current.query._tag === "Loaded"
          ? result.current.query.pages.length
          : 0,
      ).toBe(2);
    });

    await act(async () => {
      await result.current.cache.updatePages<Page>(KEY, (page, index) =>
        index === 0 ? { ...page, items: [0, ...page.items] } : page,
      );
    });

    await waitFor(() => {
      expect(
        result.current.query._tag === "Loaded"
          ? result.current.query.pages.map((page) => page.items)
          : [],
      ).toEqual([
        [0, 1, 2],
        [3, 4],
      ]);
    });
  });

  test("最初のページを読めなければ失敗を返し、取り直せる", async () => {
    let broken = true;

    const { result } = render(async (cursor) =>
      broken ? Promise.reject(new Error("読めない")) : loadPage(cursor),
    );

    await waitFor(() => {
      expect(result.current).toMatchObject({
        _tag: "Failed",
        isRetrying: false,
      });
    });
    broken = false;

    if (result.current._tag !== "Failed") throw new Error("失敗していません");

    act(result.current.retry);
    await waitFor(() => {
      expect(items(result)).toEqual([1, 2]);
    });
  });

  test("続きを読めなければ、読んだページを残したまま続きの失敗を返し、取り直せる", async () => {
    let broken = true;

    const { result } = render(async (cursor) =>
      cursor !== undefined && broken
        ? Promise.reject(new Error("読めない"))
        : loadPage(cursor),
    );

    await waitFor(() => {
      expect(items(result)).toEqual([1, 2]);
    });

    act(nextToLoad(result));
    await waitFor(() => {
      expect(result.current).toMatchObject({
        _tag: "Loaded",
        next: { _tag: "Failed", isRetrying: false },
      });
    });
    expect(items(result)).toEqual([1, 2]);
    broken = false;

    act(nextToRetry(result));
    await waitFor(() => {
      expect(items(result)).toEqual([1, 2, 3, 4]);
    });
  });

  test("続きの再試行がタブを開くまで一時停止しても、取り直していることを返す", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: 1, retryDelay: 0 } },
    });

    let broken = true;

    const { result } = render(
      (cursor) =>
        cursor !== undefined && broken
          ? Promise.reject(new Error("読めない"))
          : loadPage(cursor),
      queryClient,
    );

    await waitFor(() => {
      expect(nextOf(result)?._tag).toBe("Available");
    });
    act(nextToLoad(result));
    await waitFor(() => {
      expect(nextOf(result)?._tag).toBe("Failed");
    });

    try {
      focusManager.setFocused(false);
      act(nextToRetry(result));
      await waitFor(() => {
        expect(queryClient.getQueryState(KEY)?.fetchStatus).toBe("paused");
      });
      expect(nextOf(result)).toMatchObject({ isRetrying: true });
      broken = false;
      focusManager.setFocused(true);
      await waitFor(() => {
        expect(items(result)).toEqual([1, 2, 3, 4]);
      });
    } finally {
      focusManager.setFocused(undefined);
    }
  });
});
