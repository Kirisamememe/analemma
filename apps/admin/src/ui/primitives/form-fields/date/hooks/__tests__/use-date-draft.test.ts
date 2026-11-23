import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";

import { useDateDraft } from "../use-date-draft";

afterEach(cleanup);

describe("日付の未完の状態", () => {
  test("別の日付を経て元の日付に外から戻しても古い誤りが復活しないこと", () => {
    const { rerender, result } = renderHook(
      (value: string) => useDateDraft({ value }),
      { initialProps: "2024-02-01" },
    );

    act(() => {
      result.current.onBlur(true);
    });
    expect(result.current.incomplete).toBe(true);

    rerender("2024-03-02");
    rerender("2024-02-01");
    expect(result.current.incomplete).toBe(false);
  });
});
