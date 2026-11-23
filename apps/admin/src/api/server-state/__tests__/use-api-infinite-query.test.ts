import { QueryClient } from "@tanstack/react-query";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";

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

const render = (load: (cursor: string | undefined) => Promise<Page>) =>
  renderHook(
    () =>
      useApiInfiniteQuery({ key: KEY, load, next: (page: Page) => page.next }),
    { wrapper: withQueryClient(client()) },
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
      const next = nextOf(result);

      if (next?._tag !== "Available") throw new Error("続きを読めません");

      act(next.load);
      await waitFor(() => {
        expect(items(result)).toEqual(expected);
      });
    }

    expect(result.current).toMatchObject({ next: { _tag: "None" } });
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

    const next = nextOf(result);

    if (next?._tag !== "Available") throw new Error("続きを読めません");

    act(next.load);
    await waitFor(() => {
      expect(result.current).toMatchObject({
        _tag: "Loaded",
        next: { _tag: "Failed", isRetrying: false },
      });
    });
    expect(items(result)).toEqual([1, 2]);
    broken = false;

    const failed = nextOf(result);

    if (failed?._tag !== "Failed") throw new Error("続きの失敗がありません");

    act(failed.retry);
    await waitFor(() => {
      expect(items(result)).toEqual([1, 2, 3, 4]);
    });
  });
});
