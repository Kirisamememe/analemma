import { cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";

import { useFailedRetries } from "@/ui/patterns/hooks/use-failed-retries";

afterEach(cleanup);

type Props = {
  /** 取り直しているか。 */
  readonly isRetrying: boolean;
};

describe("useFailedRetries", () => {
  test("取り直しが終わるたびに数え、始めたときは数えない", () => {
    const { result, rerender } = renderHook(
      ({ isRetrying }: Props) => useFailedRetries(isRetrying),
      { initialProps: { isRetrying: false } },
    );

    expect(result.current).toBe(0);

    rerender({ isRetrying: true });
    expect(result.current).toBe(0);

    rerender({ isRetrying: false });
    expect(result.current).toBe(1);

    rerender({ isRetrying: false });
    expect(result.current).toBe(1);

    rerender({ isRetrying: true });
    rerender({ isRetrying: false });
    expect(result.current).toBe(2);
  });

  test("取り直している間に描き始めても、その取り直しが終わったら数える", () => {
    const { result, rerender } = renderHook(
      ({ isRetrying }: Props) => useFailedRetries(isRetrying),
      { initialProps: { isRetrying: true } },
    );

    expect(result.current).toBe(0);

    rerender({ isRetrying: false });
    expect(result.current).toBe(1);
  });
});
