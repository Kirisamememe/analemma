import { expect, test } from "bun:test";

import { seriesFormExit } from "../series-form-state";

test("変更していなければすぐに閉じ、変更があれば破棄を確かめ、送信中なら保存が続くことを伝える", () => {
  expect(seriesFormExit(false, false).ask).toBe(false);
  expect(seriesFormExit(true, false)).toMatchObject({
    ask: true,
    leave: "imageDetail.discard",
  });
  expect(seriesFormExit(true, true)).toMatchObject({
    ask: true,
    leave: "imageDetail.leaveDuringSave",
  });
  expect(seriesFormExit(false, true).ask).toBe(true);
});
