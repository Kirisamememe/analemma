import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, mock, spyOn, test } from "bun:test";

import { useCarouselSelection } from "../use-carousel-selection";

type Resized = ConstructorParameters<typeof ResizeObserver>[0];

const NativeResizeObserver = globalThis.ResizeObserver;
let resize: Resized = () => {};

class FakeResizeObserver {
  readonly observe = mock();

  readonly unobserve = mock();

  readonly disconnect = mock();

  constructor(callback: Resized) {
    resize = callback;
  }
}

afterEach(() => {
  globalThis.ResizeObserver = NativeResizeObserver;
  document.body.replaceChildren();
  rects.clear();
});

const rects = new Map<Element, DOMRect>();

const measured = <Target extends HTMLElement>(element: Target): Target => {
  const self: HTMLElement = element;

  spyOn(self, "getBoundingClientRect").mockImplementation(
    () => rects.get(element) ?? new DOMRect(),
  );

  return element;
};

const place = (element: Element, left: number): void => {
  rects.set(element, new DOMRect(left, 0, 100, 100));
};

const mount = (selectedId: number) => {
  Object.assign(globalThis, { ResizeObserver: FakeResizeObserver });

  const select = mock((_id: number): void => undefined);
  const rail = measured(document.createElement("div"));
  const scrollBy = spyOn(rail, "scrollBy").mockImplementation(() => {});

  const region = document.createElement("div");
  const scrollbar = document.createElement("div");

  rects.set(rail, new DOMRect(0, 0, 300, 100));
  region.append(rail, scrollbar);
  document.body.append(region);

  const buttons = new Map(
    [4, 7, 9].map((id, order) => {
      const button = measured(document.createElement("button"));

      place(button, order * 300);
      rail.append(button);

      return [id, button];
    }),
  );

  const { result, rerender } = renderHook(
    ({ id }) =>
      useCarouselSelection([{ id: 4 }, { id: 7 }, { id: 9 }], {
        selectedId: id,
        onSelect: select,
      }),
    { initialProps: { id: selectedId } },
  );

  for (const [id, button] of buttons) result.current.attachFrame(id)(button);

  const attach = (id: number): void => {
    const button = buttons.get(id);

    if (button === undefined) throw new Error("写真がありません");

    result.current.attachSelected(button);
  };

  const scrollTo = (id: number): void => {
    const shift = [4, 7, 9].indexOf(id) * 300;

    for (const [order, button] of [...buttons.values()].entries()) {
      place(button, order * 300 - shift);
    }
  };

  attach(selectedId);
  result.current.attachRail(rail);

  return {
    result,
    rerender,
    select,
    rail,
    scrollbar,
    scrollBy,
    buttons,
    attach,
    scrollTo,
  };
};

describe("useCarouselSelection", () => {
  test("先頭より前へは進まず、対象外のキーのブラウザ操作を保つ", () => {
    const select = mock((_id: number): void => undefined);
    const preventDefault = mock(() => {});

    const { result } = renderHook(() =>
      useCarouselSelection([{ id: 4 }, { id: 7 }], {
        selectedId: 4,
        onSelect: select,
      }),
    );

    result.current.previous();
    result.current.move({ key: "Tab", preventDefault });
    expect(preventDefault).not.toHaveBeenCalled();
    expect(select).not.toHaveBeenCalled();

    result.current.move({ key: "End", preventDefault });
    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(select.mock.calls).toEqual([[7]]);
  });

  test("利用者のスクロールが止まったら、左端にいちばん近い写真を選び、途中では選ばない", () => {
    const { select, rail, scrollBy, scrollTo } = mount(4);

    expect(scrollBy).not.toHaveBeenCalled();

    rail.dispatchEvent(new Event("wheel", { bubbles: true }));
    scrollTo(7);
    expect(select).not.toHaveBeenCalled();
    scrollTo(9);
    rail.dispatchEvent(new Event("scrollend"));
    expect(select.mock.calls).toEqual([[9]]);
  });

  test("選んだ写真へ寄せている途中で止まったら、ほかの写真を選ばずに寄せ直す", () => {
    const { select, rail, scrollBy, scrollTo } = mount(9);

    expect(scrollBy).toHaveBeenLastCalledWith({
      left: 600,
      behavior: "instant",
    });

    scrollTo(7);
    rail.dispatchEvent(new Event("scrollend"));
    expect(select).not.toHaveBeenCalled();
    expect(scrollBy).toHaveBeenLastCalledWith({
      left: 300,
      behavior: "instant",
    });
  });

  test("寄せている途中で利用者がスクロールを引き取ったら、止まった場所の写真を選ぶ", () => {
    const { select, rail, scrollTo } = mount(9);

    scrollTo(7);
    rail.dispatchEvent(new Event("pointerdown", { bubbles: true }));
    rail.dispatchEvent(new Event("scrollend"));
    expect(select.mock.calls).toEqual([[7]]);
  });

  test("写真の幅が変わっても選択を変えず、選択中の写真を左端へ戻す", () => {
    const { select, scrollBy, scrollTo } = mount(4);

    scrollTo(7);
    resize([], new NativeResizeObserver(() => {}));
    expect(select).not.toHaveBeenCalled();
    expect(scrollBy).toHaveBeenLastCalledWith({
      left: -300,
      behavior: "instant",
    });
  });

  test("写真に focus があるときにスクロールで選び直したら、選んだ写真へ focus を移す", () => {
    const { rerender, select, rail, buttons, attach, scrollTo } = mount(4);

    buttons.get(4)?.focus();
    rail.dispatchEvent(new Event("wheel", { bubbles: true }));
    scrollTo(9);
    rail.dispatchEvent(new Event("scrollend"));
    expect(select.mock.calls).toEqual([[9]]);

    rerender({ id: 9 });
    attach(9);
    expect(document.activeElement).toHaveProperty("isConnected", true);
    expect(buttons.get(9)?.matches(":focus")).toBe(true);
  });

  test("寄せている途中でスクロールバーを操作しても、止まった場所の写真を選ぶ", () => {
    const { select, rail, scrollbar, scrollTo } = mount(9);

    scrollTo(7);
    scrollbar.dispatchEvent(new Event("pointerdown", { bubbles: true }));
    rail.dispatchEvent(new Event("scrollend"));
    expect(select.mock.calls).toEqual([[7]]);
  });

  test("操作で選んだ写真へは滑らせて寄せ、スクロールで選んだ写真は寄せ直さない", () => {
    const { rerender, rail, scrollBy, attach, scrollTo } = mount(4);

    rerender({ id: 7 });
    attach(7);
    expect(scrollBy).toHaveBeenLastCalledWith({
      left: 300,
      behavior: "smooth",
    });

    scrollBy.mockClear();
    rail.dispatchEvent(new Event("wheel", { bubbles: true }));
    scrollTo(9);
    rail.dispatchEvent(new Event("scrollend"));
    rerender({ id: 9 });
    attach(9);
    expect(scrollBy).not.toHaveBeenCalled();
  });
});
