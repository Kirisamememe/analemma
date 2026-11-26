import { act, renderHook } from "@testing-library/react";
import { describe, expect, test } from "bun:test";

import { useScrollView } from "../use-scroll-view";

describe("useScrollView", () => {
  test("領域や中身の寸法が変わるとつまみの長さと位置を取り直す", () => {
    const view = document.createElement("div");
    let width = 300;
    Object.defineProperties(view, {
      clientWidth: { get: () => width },
      scrollWidth: { value: 1200 },
    });
    view.scrollLeft = 450;
    const { result } = renderHook(() => useScrollView("horizontal"));
    let disconnect: (() => void) | undefined;
    act(() => {
      disconnect = result.current.attach(view);
    });
    expect(result.current.metrics).toEqual({
      thumbFraction: 0.25,
      position: 0.5,
    });
    width = 600;
    act(() => {
      result.current.measure();
    });
    expect(result.current.metrics).toEqual({
      thumbFraction: 0.5,
      position: 0.75,
    });
    disconnect?.();
  });
});
