import { QueryClient } from "@tanstack/react-query";
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, expect, test } from "bun:test";

import { useApiData } from "@/api/server-state/use-api-data";
import { withQueryClient } from "@/testing/hook-wrappers";

afterEach(cleanup);

/** 見本の一覧。 */
type Rows = Readonly<Record<string, string>>;

/** キャッシュを変え、TanStack Query が部品に知らせ終えるまで待つ。 */
const settle = async (change: () => void): Promise<void> => {
  await act(async () => {
    change();
    await new Promise((resolve) => {
      setTimeout(resolve, 10);
    });
  });
};

test("取り出した部分が変わったときだけ、描き直すこと", async () => {
  const client = new QueryClient();
  let renders = 0;

  client.setQueryData<Rows>(["rows"], { a: "waiting", b: "waiting" });

  const { result } = renderHook(
    () => {
      renders += 1;

      return useApiData({
        key: ["rows"],
        load: () => Promise.reject(new Error("読み込まない")),
        select: (rows: Rows) => rows["a"],
      });
    },
    { wrapper: withQueryClient(client) },
  );

  expect(result.current).toBe("waiting");

  await settle(() => {
    client.setQueryData<Rows>(["rows"], { a: "waiting", b: "added" });
  });

  expect(renders).toBe(1);

  await settle(() => {
    client.setQueryData<Rows>(["rows"], { a: "added", b: "added" });
  });

  expect(result.current).toBe("added");
  expect(renders).toBe(2);
});
