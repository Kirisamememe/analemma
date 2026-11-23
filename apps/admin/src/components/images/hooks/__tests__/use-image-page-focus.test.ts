import { cleanup, renderHook } from "@testing-library/react";
import { afterEach, expect, test } from "bun:test";

import { useImagePageFocus } from "../use-image-page-focus";

afterEach(cleanup);

test("待っている間に別のページが届いても focus を移さず、対象ページに選べる写真がなければキャンセルへ移す", () => {
  const trigger = document.createElement("button");
  const cancel = document.createElement("button");
  const list = document.createElement("ul");
  document.body.append(trigger, cancel, list);

  try {
    const { result } = renderHook(() => useImagePageFocus({ current: cancel }));
    trigger.focus();
    result.current.rememberFocus(2);
    result.current.focusList(list, { first: true, lastPage: 1 });
    expect(document.activeElement).toBe(trigger);
    trigger.remove();
    result.current.focusList(list, { first: true, lastPage: 2 });
    expect(document.activeElement).toBe(cancel);
  } finally {
    trigger.remove();
    cancel.remove();
    list.remove();
  }
});
