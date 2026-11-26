import { act, renderHook } from "@testing-library/react";
import { expect, jest, test } from "bun:test";

import { useScrollThumbVisibility } from "../use-scroll-thumb-visibility";

const advance = (ms: number): void => {
  act(() => {
    jest.advanceTimersByTime(ms);
  });
};

test("領域に戻ったら非表示を取り消し、最後のポインタが離れてから5秒でつまみを隠す", () => {
  jest.useFakeTimers();

  try {
    const { result, unmount } = renderHook(() => useScrollThumbVisibility());
    const view = document.createElement("div");
    const detach = result.current.attach(view);

    const pointer = (name: string, id: number): void => {
      act(() => {
        view.dispatchEvent(new PointerEvent(name, { pointerId: id }));
      });
    };

    expect(result.current.visible).toBe(false);
    pointer("pointerenter", 1);
    pointer("pointerleave", 1);
    advance(4900);
    expect(result.current.visible).toBe(true);
    pointer("pointerenter", 2);
    pointer("pointerenter", 3);
    pointer("pointerleave", 2);
    advance(5000);
    expect(result.current.visible).toBe(true);
    pointer("pointerleave", 3);
    advance(4999);
    expect(result.current.visible).toBe(true);
    advance(1);
    expect(result.current.visible).toBe(false);
    detach?.();
    unmount();
  } finally {
    jest.useRealTimers();
  }
});
