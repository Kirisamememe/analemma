import { expect, test } from "bun:test";

import { closePrompt } from "../close-prompt";

test("保存を送っている間は保存が続くことを、ほかは入力を捨てることを確かめる", () => {
  expect(closePrompt(true)).toMatchObject({
    title: "imageDetail.leavingWhileSaving",
    leave: "imageDetail.leaveDuringSave",
  });
  expect(closePrompt(false)).toMatchObject({
    title: "imageDetail.discardTitle",
    leave: "imageDetail.discard",
  });
});
