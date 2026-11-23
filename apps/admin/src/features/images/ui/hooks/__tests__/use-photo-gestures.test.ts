import { act, renderHook } from "@testing-library/react";
import { describe, expect, mock, test } from "bun:test";

import { usePhotoGestures } from "../use-photo-gestures";

const touch = {
  isPrimary: true,
  pointerType: "touch",
  target: document.createElement("img"),
  pointerId: 1,
  clientX: 100,
  clientY: 100,
  timeStamp: 100,
} as const;

describe("usePhotoGestures", () => {
  test("写真をタップするたびに矢印の表示を切り替え、リンクのタップはそのまま通す", () => {
    const { result } = renderHook(() => usePhotoGestures(() => undefined));

    const tap = (target: Element) => {
      act(() => {
        result.current.handlers.onPointerDown({ ...touch, target });
        result.current.handlers.onPointerUp({ ...touch, target });
      });
    };

    tap(touch.target);
    expect(result.current.controlsVisible).toBe(true);
    tap(document.createElement("a"));
    expect(result.current.controlsVisible).toBe(true);
    tap(touch.target);
    expect(result.current.controlsVisible).toBe(false);
  });

  test("タッチの左右スワイプだけを通知し、2本の指・縦スクロール・マウスの動きは通す", () => {
    const onSwipe = mock((_: "next" | "previous"): void => undefined);
    const { result } = renderHook(() => usePhotoGestures(onSwipe));

    const { onPointerUp, onPointerDown, onPointerCancel } =
      result.current.handlers;

    onPointerDown(touch);
    onPointerUp({ ...touch, clientX: 20 });
    onPointerDown(touch);
    onPointerUp({ ...touch, clientX: 180 });
    onPointerDown({ ...touch, pointerType: "mouse" });
    onPointerUp({ ...touch, clientX: 180 });
    onPointerDown(touch);
    onPointerDown({ ...touch, pointerId: 2, isPrimary: false });
    onPointerUp({ ...touch, clientX: 180 });
    onPointerDown(touch);
    onPointerUp({ ...touch, clientY: 180 });
    onPointerDown(touch);
    onPointerCancel();
    onPointerUp(touch);
    expect(result.current.controlsVisible).toBe(false);
    expect(onSwipe.mock.calls).toEqual([["next"], ["previous"]]);
  });
});
