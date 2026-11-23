import { QueryClient } from "@tanstack/react-query";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, expect, test } from "bun:test";

import { useApiQuery } from "@/api/server-state/server-state";
import { withQueryClient } from "@/testing/hook-wrappers";

afterEach(cleanup);

test("表示に使う値を取り出し、キャッシュには応答の全体を保つ", async () => {
  const cache = new QueryClient();
  const key = ["series"];

  const { result } = renderHook(
    () =>
      useApiQuery({
        key,
        load: () => Promise.resolve({ name: "山", description: "雪" }),
        select: (entry) => entry.name,
      }),
    { wrapper: withQueryClient(cache) },
  );

  await waitFor(() => {
    expect(result.current).toEqual({ _tag: "Loaded", data: "山" });
  });
  expect(cache.getQueryData(key)).toEqual({ name: "山", description: "雪" });
  act(() => {
    cache.setQueryData(key, { name: "湖", description: "朝" });
  });
  await waitFor(() => {
    expect(result.current).toEqual({ _tag: "Loaded", data: "湖" });
  });
});
