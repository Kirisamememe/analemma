import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, spyOn, test } from "bun:test";

import { ScrollView } from "../scroll-view";

afterEach(cleanup);

const measuredViewport = (measure: (element: HTMLDivElement) => void) => {
  let current: HTMLDivElement | null = null;
  return {
    attach: (element: HTMLDivElement | null): void => {
      current = element;

      if (element) measure(element);
    },
    element: () => {
      if (!current) throw new Error("スクロール領域がありません");

      return current;
    },
  };
};

describe("ScrollView", () => {
  test("内容が収まるとバーを隠し、はみ出す横の内容はキーで両端までスクロールする", () => {
    let length = 180;

    const viewport = measuredViewport((element) => {
      Object.defineProperties(element, {
        scrollWidth: { get: () => length },
        clientWidth: { value: 200 },
      });
    });

    render(
      <ScrollView
        orientation="horizontal"
        label="月ごとの写真"
        viewportRef={viewport.attach}
      >
        <span>12月</span>
      </ScrollView>,
    );
    expect(screen.queryByRole("scrollbar")).toBeNull();
    length = 800;
    fireEvent.scroll(viewport.element());
    const bar = screen.getByRole("scrollbar", { name: "月ごとの写真" });
    expect(bar.getAttribute("aria-controls")).toBe(viewport.element().id);
    fireEvent.keyDown(bar, { key: "ArrowRight" });
    expect(viewport.element().scrollLeft).toBe(40);
    fireEvent.keyDown(bar, { key: "End" });
    expect(viewport.element().scrollLeft).toBe(600);
    expect(bar.getAttribute("aria-valuenow")).toBe("100");
    fireEvent.keyDown(bar, { key: "Home" });
    expect(viewport.element().scrollLeft).toBe(0);
    length = 100;
    fireEvent.scroll(viewport.element());
    expect(screen.queryByRole("scrollbar")).toBeNull();
  });

  test("つまみは押した位置を保ってドラッグし、レールを押すとその位置へ移る", () => {
    const viewport = measuredViewport((element) => {
      Object.defineProperties(element, {
        scrollWidth: { value: 800 },
        clientWidth: { value: 200 },
      });
    });

    render(
      <ScrollView
        orientation="horizontal"
        label="写真"
        viewportRef={viewport.attach}
      >
        写真
      </ScrollView>,
    );
    const bar = screen.getByRole("scrollbar", { name: "写真" });
    using thumbBox = spyOn(
      HTMLElement.prototype,
      "getBoundingClientRect",
    ).mockReturnValue(new DOMRect(0, 0, 50, 24));
    Object.defineProperty(bar, "getBoundingClientRect", {
      value: () => new DOMRect(0, 0, 200, 24),
    });

    const pointer = {
      pointerId: 8,
      isPrimary: true,
      button: 0,
      pointerType: "touch",
    };

    fireEvent.pointerDown(bar, { ...pointer, clientX: 20 });
    fireEvent.pointerMove(bar, { ...pointer, pointerId: 9, clientX: 100 });
    expect(viewport.element().scrollLeft).toBe(0);
    fireEvent.pointerMove(bar, { ...pointer, clientX: 100 });
    expect(viewport.element().scrollLeft).toBe(320);
    fireEvent.lostPointerCapture(bar, pointer);
    fireEvent.pointerMove(bar, { ...pointer, clientX: 10 });
    expect(viewport.element().scrollLeft).toBe(320);
    fireEvent.pointerDown(bar, { ...pointer, clientX: 175 });
    expect(viewport.element().scrollLeft).toBe(600);
  });

  test("縦のバーでは PageDown で表示領域の高さだけ進み、ブラウザからのスクロールもバーに伝わる", () => {
    const viewport = measuredViewport((element) => {
      Object.defineProperties(element, {
        scrollHeight: { value: 1000 },
        clientHeight: { value: 200 },
      });
    });

    render(
      <ScrollView
        orientation="vertical"
        label="一覧"
        viewportRef={viewport.attach}
      >
        <span>12月</span>
      </ScrollView>,
    );
    const bar = screen.getByRole("scrollbar", { name: "一覧" });
    expect(bar.getAttribute("aria-orientation")).toBe("vertical");
    fireEvent.keyDown(bar, { key: "PageDown" });
    expect(viewport.element().scrollTop).toBe(200);
    fireEvent.wheel(bar, { deltaY: 70 });
    expect(viewport.element().scrollTop).toBe(270);
    fireEvent.wheel(bar, { deltaMode: WheelEvent.DOM_DELTA_PAGE, deltaY: 1 });
    expect(viewport.element().scrollTop).toBe(470);
    viewport.element().scrollTop = 400;
    fireEvent.scroll(viewport.element());
    expect(bar.getAttribute("aria-valuenow")).toBe("50");
  });
});
