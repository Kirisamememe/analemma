import { expect, mock, test } from "bun:test";

import { createUploadValue } from "../upload-value";

test("購読した部品には値が変わったときだけ通知し、購読を終えた後も最新の値は読める", () => {
  const value = createUploadValue(0);
  const read: number[] = [];

  const notify = mock(() => {
    read.push(value.read());
  });

  const unsubscribe = value.subscribe(notify);

  value.set(25);
  value.set(25);
  unsubscribe();
  value.set(70);
  expect(notify).toHaveBeenCalledTimes(1);
  expect(read).toEqual([25]);
  expect(value.read()).toBe(70);
});
