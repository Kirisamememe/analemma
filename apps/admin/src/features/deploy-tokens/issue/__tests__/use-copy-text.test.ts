import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, spyOn, test } from "bun:test";

import { useCopyText } from "@/features/deploy-tokens/issue/use-copy-text";

afterEach(cleanup);

describe("useCopyText", () => {
  test("クリップボードへの書き込みが失敗しても、新しい文字列でコピーし直せる", async () => {
    using write = spyOn(navigator.clipboard, "writeText")
      .mockRejectedValueOnce(new DOMException("denied", "NotAllowedError"))
      .mockResolvedValue(undefined);
    const { result, rerender } = renderHook(
      (text: string) => useCopyText(text),
      {
        initialProps: "最初の値",
      },
    );

    await act(() => result.current.copy());
    expect(result.current.result).toBe("Failed");

    rerender("新しい値");
    await act(() => result.current.copy());
    expect(write.mock.calls).toEqual([["最初の値"], ["新しい値"]]);
    expect(result.current.result).toBe("Copied");
  });
});
