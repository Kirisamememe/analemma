import { cleanup, renderHook } from "@testing-library/react";
import { afterEach, expect, test } from "bun:test";

import {
  type PickerSelection,
  useImageSelection,
} from "../use-image-selection";

import { createImageRoutes } from "@/testing/fake-routes/create-image-routes";

afterEach(cleanup);

test("選んだ画像が追加済みになったとき、選択元を保って確定できる枚数を更新する", () => {
  const [image] = createImageRoutes([{ title: "湖" }]).images();

  if (image === undefined) throw new Error("テスト用の画像がありません");

  const options: PickerSelection = {
    mode: "multiple",
    onConfirm: () => undefined,
  };

  const { result, rerender } = renderHook(
    (props: PickerSelection) => useImageSelection(props),
    { initialProps: options },
  );

  const { source, conditions } = result.current;
  conditions.change(image, true);
  expect(result.current.count()).toBe(1);
  rerender({ ...options, included: new Set([image.id]) });
  expect(result.current.source).toBe(source);
  expect(result.current.count()).toBe(0);
});
