import { QueryClient } from "@tanstack/react-query";
import { cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, expect, mock, test } from "bun:test";

import { useApiPolling } from "@/api/server-state/use-api-polling";
import { withQueryClient } from "@/testing/hook-wrappers";

afterEach(cleanup);

test("間隔を返す間だけ読み直し、描き直させないこと", async () => {
  const client = new QueryClient();
  let count = 0;
  let renders = 0;

  const load = mock(() => {
    count += 1;

    return Promise.resolve({ done: count >= 3 });
  });

  renderHook(
    () => {
      renders += 1;

      useApiPolling({
        key: ["progress"],
        load,
        interval: (progress) => (progress?.done === true ? false : 10),
      });
    },
    { wrapper: withQueryClient(client) },
  );

  await waitFor(() => {
    expect(client.getQueryData(["progress"])).toEqual({ done: true });
  });
  await new Promise((resolve) => {
    setTimeout(resolve, 50);
  });

  expect(load).toHaveBeenCalledTimes(3);
  expect(renders).toBe(1);
});
