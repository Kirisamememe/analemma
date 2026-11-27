import { QueryClient } from "@tanstack/react-query";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, expect, test } from "bun:test";

import { useApiQuery } from "@/api/server-state/server-state";
import { withQueryClient } from "@/testing/hook-wrappers";

afterEach(cleanup);

const KEY = ["admin", "passkeys", "list"] as const;

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
