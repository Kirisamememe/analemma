import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, expect, test } from "bun:test";

import { useImageDialog } from "../use-image-dialog";

afterEach(cleanup);

test("別の写真を開いてから元に戻っても、前の Dialog は開かない", () => {
  const { result, rerender } = renderHook(
    ({ id, disabled }) => useImageDialog(id, disabled),
    { initialProps: { id: "a", disabled: false } },
  );

  act(() => {
    result.current.open();
  });
  const closeFirst = result.current.close;
  expect(result.current.isOpen).toBe(true);
  rerender({ id: "a", disabled: true });
  expect(result.current.isOpen).toBe(false);
  rerender({ id: "b", disabled: false });
  act(() => {
    result.current.open();
    closeFirst();
  });
  expect(result.current.isOpen).toBe(true);
  rerender({ id: "a", disabled: false });
  expect(result.current.isOpen).toBe(false);
});
