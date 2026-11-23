import { cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";

import { useRetryFocus } from "../use-retry-focus";

afterEach(cleanup);

const setUp = () => {
  const button = document.createElement("button");
  const region = document.createElement("section");
  region.tabIndex = -1;
  document.body.append(button, region);
  const { result } = renderHook(useRetryFocus);

  return { button, region, result };
};

describe("取り直した後の focus", () => {
  test("取り直すボタンに focus があれば、読み込んだ欄に移す", () => {
    const { button, region, result } = setUp();
    button.focus();
    result.current.remember(button);
    button.remove();
    result.current.focus(region);
    expect(document.activeElement).toBe(region);
    region.remove();
  });

  test("取り直すボタンに focus がなければ、読み込んだ欄に移さない", () => {
    const { button, region, result } = setUp();
    result.current.remember(button);
    button.remove();
    result.current.focus(region);
    expect(document.activeElement).not.toBe(region);
    region.remove();
  });

  test("応答を待つ間に別のボタンに移った focus を奪わない", () => {
    const { button, region, result } = setUp();
    const other = document.createElement("button");
    document.body.append(other);
    button.focus();
    result.current.remember(button);
    other.focus();
    button.remove();
    result.current.focus(region);
    expect(document.activeElement).toBe(other);
    region.remove();
    other.remove();
  });
});
