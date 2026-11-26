import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, expect, mock, test } from "bun:test";

import { useRetryFocus } from "@/features/images/upload/hooks/use-retry-focus";
import type { PhotoUpload } from "@/features/images/upload/logic/photo-uploads";

afterEach(() => {
  cleanup();
  document.body.replaceChildren();
});

const upload = (values: Partial<PhotoUpload>): PhotoUpload => ({
  id: 1,
  file: new File(["x"], "a.jpg"),
  status: "waiting",
  ...values,
});

const setUp = () => {
  const retry = mock((_id: number) => undefined);
  const clear = mock(() => undefined);
  const { result } = renderHook(() => useRetryFocus({ retry, clear }));
  const addButton = document.createElement("button");
  const row = document.createElement("li");
  const link = document.createElement("a");

  link.href = "/images/1";
  row.append(link);
  document.body.append(addButton, row);
  result.current.addButton.current = addButton;

  return { result, retry, clear, addButton, row, link };
};

test("送り直した写真が足せたら、その行のリンクに focus を移し、まだ送っている間は動かさない", () => {
  const { result, retry, row, link } = setUp();

  act(() => {
    result.current.retry(1);
  });
  expect(retry).toHaveBeenCalledWith(1);

  result.current.restore(row, upload({ status: "sending" }));
  expect(document.activeElement).toBe(document.body);

  result.current.restore(row, upload({ status: "added", imageId: "x" }));
  expect(document.activeElement).toBe(link);
});

test("送り直した写真が足せなければ追加のボタンへ移し、自分で動かした focus と、ほかの写真の行では動かさない", () => {
  const { result, addButton, row } = setUp();
  const other = document.createElement("button");

  document.body.append(other);

  act(() => {
    result.current.retry(1);
  });
  result.current.restore(row, upload({ id: 2, status: "unsupported" }));
  expect(document.activeElement).toBe(document.body);

  other.focus();
  result.current.restore(row, upload({ status: "unsupported" }));
  expect(document.activeElement).toBe(other);

  other.blur();
  act(() => {
    result.current.retry(1);
  });
  result.current.restore(row, upload({ status: "unsupported" }));
  expect(document.activeElement).toBe(addButton);
});

test("結果を閉じたら、追加のボタンに focus を戻す", () => {
  const { result, clear, addButton } = setUp();

  act(() => {
    result.current.clear();
  });

  expect(clear).toHaveBeenCalledTimes(1);
  expect(document.activeElement).toBe(addButton);
});
