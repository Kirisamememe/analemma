import { QueryClient } from "@tanstack/react-query";
import { cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, expect, mock, test } from "bun:test";

import { useApiQuery } from "@/api/server-state/server-state";
import { withQueryClient } from "@/testing/hook-wrappers";

afterEach(cleanup);

type Props = {
  /** 取得してよいか。 */
  readonly enabled: boolean;
};

test("取得してよくなるまでは、取得せずに読み込み中を返す", async () => {
  const load = mock(() => Promise.resolve(["MacBook"]));

  const { result, rerender } = renderHook(
    ({ enabled }: Props) =>
      useApiQuery({ key: ["admin", "passkeys", "list"], load, enabled }),
    {
      wrapper: withQueryClient(new QueryClient()),
      initialProps: { enabled: false },
    },
  );

  expect(result.current).toEqual({ _tag: "Loading" });
  expect(load).not.toHaveBeenCalled();

  rerender({ enabled: true });

  await waitFor(() => {
    expect(result.current).toEqual({ _tag: "Loaded", data: ["MacBook"] });
  });
  expect(load).toHaveBeenCalledTimes(1);
});
