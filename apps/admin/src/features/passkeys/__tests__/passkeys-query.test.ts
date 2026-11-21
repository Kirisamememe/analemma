import { QueryClient, QueryObserver } from "@tanstack/react-query";
import { describe, expect, test } from "bun:test";

import { PASSKEYS_QUERY_KEY, refreshPasskeys } from "../passkeys-query";

describe("refreshPasskeys", () => {
  test("操作の前に送った最初の取得が遅れて届いても、操作の後の一覧を出す", async () => {
    const queryClient = new QueryClient();
    const first = Promise.withResolvers<string[]>();
    let fetches = 0;
    const observer = new QueryObserver(queryClient, {
      queryKey: PASSKEYS_QUERY_KEY,
      queryFn: async () => {
        fetches += 1;

        return fetches === 1 ? first.promise : ["MacBook", "iPhone"];
      },
    });
    const unsubscribe = observer.subscribe(() => undefined);

    await refreshPasskeys(queryClient);
    first.resolve(["MacBook"]);

    expect(queryClient.getQueryData(PASSKEYS_QUERY_KEY)).toEqual([
      "MacBook",
      "iPhone",
    ]);

    unsubscribe();
  });
});
