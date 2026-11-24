import { describe, expect, test } from "bun:test";

import { definitionScreen, editScreen } from "../edit-screen";

import type { ApiQueryResult } from "@/api/server-state/server-state";

type Found =
  | {
      /** どの結果か。 */
      _tag: "Succeeded";
      /** 取得したデータ。 */
      data: string;
    }
  | Record<"_tag", "Failed">;

const retry = { isRetrying: false, retry: () => undefined };
const loading: ApiQueryResult<Found> = { _tag: "Loading" };
const failed: ApiQueryResult<Found> = { _tag: "Failed", ...retry };

const found = (data: string): ApiQueryResult<Found> => ({
  _tag: "Loaded",
  data: { _tag: "Succeeded", data },
});

const gone: ApiQueryResult<Found> = {
  _tag: "Loaded",
  data: { _tag: "Failed" },
};

describe("definitionScreen", () => {
  test("定義が届いたらフォームを、届かない・無いときはそれを伝える欄を出す", () => {
    expect(definitionScreen(found("紹介"))).toEqual({
      _tag: "Editor",
      kind: "紹介",
      refreshFailure: undefined,
    });
    expect(definitionScreen(loading)._tag).toBe("Loading");
    expect(definitionScreen(failed)).toMatchObject({ _tag: "KindFailed" });
    expect(definitionScreen(gone)._tag).toBe("KindGone");
  });
});

describe("editScreen", () => {
  test("固定ページと種類の定義がそろったら、両方を持つフォームを出す", () => {
    expect(editScreen(found("about"), found("紹介"))).toEqual({
      _tag: "Editor",
      page: "about",
      kind: "紹介",
      refreshFailure: undefined,
      canDelete: true,
    });
  });

  test("固定ページを読めない・無いときは、種類の定義によらず、固定ページのことを伝える", () => {
    expect(editScreen(failed, loading)).toMatchObject({ _tag: "PageFailed" });
    expect(editScreen(gone, loading)._tag).toBe("PageGone");
  });

  test("どちらかを待つ間は、読み込み中を出し続ける", () => {
    expect(editScreen(loading, loading)._tag).toBe("Loading");
    expect(editScreen(found("about"), loading)._tag).toBe("Loading");
  });

  test("固定ページがあり、種類の定義を読めない・無いときは、固定ページと一緒に種類の定義のことを伝える", () => {
    expect(editScreen(found("about"), failed)).toMatchObject({
      _tag: "KindFailed",
      page: "about",
    });
    expect(editScreen(found("about"), gone)).toEqual({
      _tag: "KindGone",
      page: "about",
      canDelete: true,
    });
  });

  test("種類の定義を取り直している間は、固定ページを削除させない", () => {
    const retrying: ApiQueryResult<Found> = {
      _tag: "Failed",
      isRetrying: true,
      retry: () => undefined,
    };

    expect(editScreen(found("about"), failed)).toMatchObject({
      canDelete: true,
    });
    expect(editScreen(found("about"), retrying)).toMatchObject({
      canDelete: false,
    });
  });
});
