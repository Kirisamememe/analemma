import { cleanup, fireEvent, renderHook } from "@testing-library/react";
import { afterEach, expect, mock, test } from "bun:test";

import { usePhotoDrop } from "@/features/images/upload/hooks/use-photo-drop";

afterEach(cleanup);

test("子要素に重ね直しても写真を落とせることを示し、画面を出ると消す", () => {
  const receive = mock<(files: readonly File[]) => void>();
  const { result } = renderHook(() => usePhotoDrop(receive));
  const child = document.createElement("span");

  document.body.append(child);
  const drag = { dataTransfer: new DataTransfer() };

  drag.dataTransfer.items.add(new File(["a"], "a.jpg"));
  fireEvent.dragEnter(document.body, drag);
  fireEvent.dragEnter(child, drag);
  fireEvent.dragLeave(document.body, drag);
  expect(result.current).toBe(true);
  fireEvent.dragLeave(child, drag);
  expect(result.current).toBe(false);
  child.remove();
});

test("落とした写真をまとめて渡し、続けて落とした写真もそのときの受け取り先に渡す", () => {
  const first = mock<(files: readonly File[]) => void>();
  const next = mock<(files: readonly File[]) => void>();

  const { result, rerender, unmount } = renderHook(usePhotoDrop, {
    initialProps: first,
  });

  const data = new DataTransfer();
  const a = new File(["a"], "a.jpg");
  const b = new File(["b"], "b.heic");

  data.items.add(a);
  data.items.add(b);
  const drag = { dataTransfer: data };

  fireEvent.dragEnter(document.body, drag);
  expect(fireEvent.dragOver(document.body, drag)).toBe(false);
  expect(fireEvent.drop(document.body, drag)).toBe(false);
  expect(first.mock.calls).toEqual([[[a, b]]]);
  expect(result.current).toBe(false);

  rerender(next);
  fireEvent.dragEnter(document.body, drag);
  fireEvent.drop(document.body, drag);
  expect(next.mock.calls).toEqual([[[a, b]]]);

  unmount();
  expect(fireEvent.dragOver(document.body, drag)).toBe(true);
  expect(fireEvent.drop(document.body, drag)).toBe(true);
  expect(next).toHaveBeenCalledTimes(1);
});

test("テキストを移す操作はブラウザに任せる", () => {
  const receive = mock<(files: readonly File[]) => void>();
  const { result } = renderHook(() => usePhotoDrop(receive));
  const data = new DataTransfer();

  data.setData("text/plain", "写真の説明");
  const drag = { dataTransfer: data };

  expect(fireEvent.dragEnter(document.body, drag)).toBe(true);
  expect(fireEvent.dragOver(document.body, drag)).toBe(true);
  expect(fireEvent.drop(document.body, drag)).toBe(true);
  expect(result.current).toBe(false);
  expect(receive).not.toHaveBeenCalled();
});
