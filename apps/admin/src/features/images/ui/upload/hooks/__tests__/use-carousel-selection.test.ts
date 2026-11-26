import { renderHook } from "@testing-library/react";
import { describe, expect, mock, test } from "bun:test";

import { useCarouselSelection } from "../use-carousel-selection";

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
});
