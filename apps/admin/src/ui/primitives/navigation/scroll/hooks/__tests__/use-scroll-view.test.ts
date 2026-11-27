import { act, renderHook } from "@testing-library/react";
import { describe, expect, spyOn, test } from "bun:test";

import { useScrollView } from "../use-scroll-view";

describe("useScrollView", () => {
  test("領域と中身を監視し、寸法が変わるとつまみの長さと位置を取り直す", () => {
    const view = document.createElement("div");
    const content = document.createElement("div");
    let width = 300;
    Object.defineProperties(view, {
      clientWidth: { get: () => width },
      scrollWidth: { value: 1200 },
    });
    view.scrollLeft = 450;
    const native = globalThis.ResizeObserver;
    let notify: (() => void) | undefined;
    using observe = spyOn(native.prototype, "observe");
    using disconnect = spyOn(native.prototype, "disconnect");
    globalThis.ResizeObserver = class extends native {
      constructor(callback: ResizeObserverCallback) {
        super(callback);
        notify = () => {
          callback([], this);
        };
      }
    };

    try {
      const { result } = renderHook(() => useScrollView("horizontal"));
      result.current.content.current = content;
      let detach: (() => void) | undefined;
      act(() => {
        detach = result.current.attach(view);
      });
      expect(observe).toHaveBeenCalledWith(view);
      expect(observe).toHaveBeenCalledWith(content);
      expect(result.current.metrics).toEqual({
        thumbFraction: 0.25,
        position: 0.5,
      });
      width = 600;
      act(() => {
        notify?.();
      });
      expect(result.current.metrics).toEqual({
        thumbFraction: 0.5,
        position: 0.75,
      });
      detach?.();
      expect(disconnect).toHaveBeenCalledTimes(1);
    } finally {
      globalThis.ResizeObserver = native;
    }
  });
});
