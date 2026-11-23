import { cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, expect, test } from "bun:test";

import { useLoadingAnnouncement } from "@/ui/patterns/hooks/use-loading-announcement";

afterEach(cleanup);

test("読み込みの開始から少し待って通知する", async () => {
  const { result } = renderHook(useLoadingAnnouncement);

  expect(result.current).toBe(false);
  await waitFor(() => {
    expect(result.current).toBe(true);
  });
});
