import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, expect, mock, test } from "bun:test";

import { useImageField } from "../use-image-field";

afterEach(cleanup);

test("キャンセルと同じ画像の確定では値を変えず、取り外すと未入力に戻す", () => {
  const change = mock((_value: string | null): void => undefined);
  const { result } = renderHook(() => useImageField("photo", change));
  act(result.current.choose);
  expect(result.current.open).toBe(true);
  act(result.current.close);
  expect(result.current.open).toBe(false);
  act(result.current.choose);
  act(() => {
    result.current.confirm({ id: "photo" });
  });
  expect(result.current.open).toBe(false);
  expect(change).not.toHaveBeenCalled();
  act(result.current.remove);
  expect(change).toHaveBeenCalledWith(null);
});
