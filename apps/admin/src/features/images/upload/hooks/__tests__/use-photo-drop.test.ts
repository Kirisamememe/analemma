import { cleanup, fireEvent, renderHook } from "@testing-library/react";
import { afterEach, expect, mock, test } from "bun:test";

import { usePhotoDrop } from "@/features/images/upload/hooks/use-photo-drop";

afterEach(cleanup);

test("子要素に重ね直しても写真を落とせることを示し、画面を出ると消す", () => {
  const receive = mock<(files: readonly File[]) => void>();
  const { result } = renderHook(() => usePhotoDrop(document.body, receive));
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

  const { result, rerender, unmount } = renderHook(
    (receive: typeof first) => usePhotoDrop(document.body, receive),
    {
      initialProps: first,
    },
  );

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
  const { result } = renderHook(() => usePhotoDrop(document.body, receive));
  const data = new DataTransfer();

  data.setData("text/plain", "写真の説明");
  const drag = { dataTransfer: data };

  expect(fireEvent.dragEnter(document.body, drag)).toBe(true);
  expect(fireEvent.dragOver(document.body, drag)).toBe(true);
  expect(fireEvent.drop(document.body, drag)).toBe(true);
  expect(result.current).toBe(false);
  expect(receive).not.toHaveBeenCalled();
});

test("写真をナビや Dialog の背景に落としても公開せず、ファイルへの移動も防ぐ", () => {
  const main = document.createElement("main");
  const panel = document.createElement("section");
  const nav = document.createElement("nav");
  document.body.append(main, panel, nav);
  const receive = mock<(files: readonly File[]) => void>();
  const { result, rerender } = renderHook(
    (target: HTMLElement) => usePhotoDrop(target, receive),
    { initialProps: main },
  );
  const data = new DataTransfer();
  data.items.add(new File(["photo"], "private.jpg"));
  const drag = { dataTransfer: data };
  fireEvent.dragEnter(main, drag);
  expect(result.current).toBe(true);
  fireEvent.dragEnter(nav, drag);
  expect(result.current).toBe(false);
  const over = () =>
    Object.assign(new Event("dragover", { bubbles: true, cancelable: true }), {
      dataTransfer: data,
    });
  expect(fireEvent(nav, over())).toBe(false);
  expect(data.dropEffect).toBe("none");
  expect(fireEvent.drop(nav, drag)).toBe(false);
  rerender(panel);
  fireEvent.drop(main, drag);
  expect(receive).not.toHaveBeenCalled();
  fireEvent(panel, over());
  expect(data.dropEffect).toBe("copy");
  fireEvent.drop(panel, drag);
  expect(receive).toHaveBeenCalledTimes(1);
  main.remove();
  panel.remove();
  nav.remove();
});
