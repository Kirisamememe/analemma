import { describe, expect, test } from "bun:test";

import { editScreen, loadStage } from "../load-stage";

describe("loadStage", () => {
  test("取得の状態と、server が無いと答えたかで、進み具合を分ける", () => {
    expect(loadStage({ _tag: "Loading" })).toBe("Loading");
    expect(
      loadStage({ _tag: "Failed", isRetrying: false, retry: () => undefined }),
    ).toBe("Failed");
    expect(loadStage({ _tag: "Loaded", data: { _tag: "Succeeded" } })).toBe(
      "Found",
    );
    expect(loadStage({ _tag: "Loaded", data: { _tag: "Failed" } })).toBe(
      "Missing",
    );
  });
});

describe("editScreen", () => {
  test("固定ページと種類の定義がそろったら、編集のフォームを出す", () => {
    expect(editScreen("Found", "Found")).toBe("Editor");
  });

  test("固定ページを読めない・無いときは、種類の定義によらず、固定ページのことを伝える", () => {
    expect(editScreen("Failed", "Loading")).toBe("PageFailed");
    expect(editScreen("Missing", "Loading")).toBe("PageGone");
  });

  test("どちらかを待つ間は、読み込み中を出し続ける", () => {
    expect(editScreen("Loading", "Loading")).toBe("Loading");
    expect(editScreen("Found", "Loading")).toBe("Loading");
  });

  test("固定ページがあり、種類の定義を読めない・無いときは、種類の定義のことを伝える", () => {
    expect(editScreen("Found", "Failed")).toBe("KindFailed");
    expect(editScreen("Found", "Missing")).toBe("KindGone");
  });
});
