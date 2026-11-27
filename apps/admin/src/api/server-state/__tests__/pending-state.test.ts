import { QueryClient } from "@tanstack/react-query";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, expect, test } from "bun:test";

import { useIsLoadingFirstData } from "@/api/server-state/pending-state";
import { useApiCache, useApiQuery } from "@/api/server-state/server-state";
import { withQueryClient } from "@/testing/hook-wrappers";

afterEach(cleanup);

const KEY = ["admin", "passkeys", "list"] as const;

/** 順に返す応答を受け取り、取得と、待っているかと、キャッシュの操作を描く。 */
const renderWithQuery = (
  client: QueryClient,
  responses: (() => Promise<string[]>)[],
) =>
  renderHook(
    () => ({
      query: useApiQuery({
        key: KEY,
        load: () =>
          (
            responses.shift() ??
            (() => Promise.reject(new Error("取得が多すぎる")))
          )(),
      }),
      loading: useIsLoadingFirstData(),
      cache: useApiCache(),
    }),
    { wrapper: withQueryClient(client) },
  );

test("最初のデータを待つ間だけ、待っていると返す", async () => {
  const response = Promise.withResolvers<string[]>();

  const { result } = renderWithQuery(new QueryClient(), [
    () => response.promise,
  ]);

  await waitFor(() => {
    expect(result.current.loading).toBe(true);
  });
  response.resolve(["MacBook"]);

  await waitFor(() => {
    expect(result.current.loading).toBe(false);
  });
  expect(result.current.query).toEqual({ _tag: "Loaded", data: ["MacBook"] });
});

test("データのある取得を取り直している間は、待っていると返さない", async () => {
  const client = new QueryClient();
  const refetched = Promise.withResolvers<string[]>();

  const { result } = renderWithQuery(client, [
    () => Promise.resolve(["MacBook"]),
    () => refetched.promise,
  ]);

  await waitFor(() => {
    expect(result.current.query).toEqual({ _tag: "Loaded", data: ["MacBook"] });
  });

  let refreshing = Promise.resolve();

  act(() => {
    refreshing = result.current.cache.refresh(KEY);
  });

  await waitFor(() => {
    expect(client.isFetching({ queryKey: KEY })).toBe(1);
  });
  expect(result.current.loading).toBe(false);

  refetched.resolve(["iPhone"]);
  await act(() => refreshing);
});

test("取得が失敗して、データの無いまま取り直す間は、待っていると返す", async () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  const retried = Promise.withResolvers<string[]>();

  const { result } = renderWithQuery(client, [
    () => Promise.reject(new Error("取得できない")),
    () => retried.promise,
  ]);

  await waitFor(() => {
    expect(result.current.query).toMatchObject({ _tag: "Failed" });
  });
  expect(result.current.loading).toBe(false);

  act(() => {
    if (result.current.query._tag === "Failed") result.current.query.retry();
  });

  await waitFor(() => {
    expect(result.current.loading).toBe(true);
  });
  retried.resolve(["MacBook"]);

  await waitFor(() => {
    expect(result.current.loading).toBe(false);
  });
});

test("画面が使わなくなった取得は、終わっていなくても数えない", async () => {
  const client = new QueryClient();
  const response = Promise.withResolvers<string[]>();
  const opened = renderWithQuery(client, [() => response.promise]);

  const waiting = renderHook(useIsLoadingFirstData, {
    wrapper: withQueryClient(client),
  });

  await waitFor(() => {
    expect(waiting.result.current).toBe(true);
  });
  opened.unmount();

  await waitFor(() => {
    expect(waiting.result.current).toBe(false);
  });
  response.resolve(["MacBook"]);
});
