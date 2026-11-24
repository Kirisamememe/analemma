import { expect, test } from "bun:test";

import {
  seriesFormExit,
  seriesSaveFailure,
  mergeSavedSeries,
} from "../series-form-state";

import { createImageRoutes } from "@/testing/fake-routes/create-image-routes";

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

test("slug の重複では直す値を返し、シリーズが無いときは専用の知らせを返す", () => {
  expect(seriesSaveFailure("SLUG_TAKEN", "trip")).toEqual({
    refusedSlug: "trip",
    message: "series.saveFailed",
  });
  expect(seriesSaveFailure("NOT_FOUND", "trip")).toEqual({
    message: "series.gone",
  });
});

test("編集の応答では取得済みの公開状態と画像を保ち、名前・slug・説明だけを更新する", () => {
  const current = {
    id: "series",
    name: "旧",
    slug: "old",
    description: null,
    published: true,
    publishedAt: "2026-05-01T00:00:00Z",
    images: [...createImageRoutes([{ title: "春" }]).images()],
  };

  const saved = {
    id: current.id,
    name: "新",
    slug: "new",
    description: "写真",
    published: false,
    publishedAt: null,
  };

  expect(mergeSavedSeries(saved)({ _tag: "Succeeded", data: current })).toEqual(
    {
      _tag: "Succeeded",
      data: { ...current, name: "新", slug: "new", description: "写真" },
    },
  );
});
