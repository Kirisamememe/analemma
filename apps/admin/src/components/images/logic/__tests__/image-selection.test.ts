import { expect, test } from "bun:test";

import {
  availableImages,
  changeSelection,
  type SelectionOptions,
} from "../image-selection";

import { createImageRoutes } from "@/testing/fake-routes/create-image-routes";

const [sea, hill, lake] = createImageRoutes([
  { title: "海" },
  { title: "山" },
  { title: "湖" },
]).images();

if (sea === undefined || hill === undefined || lake === undefined) {
  throw new Error("テスト用の画像が足りません");
}

const single = { mode: "single" } satisfies SelectionOptions;
const multiple = { mode: "multiple" } satisfies SelectionOptions;

test("1枚だけ選ぶ場合は前の画像を入れ替える", () => {
  const first = changeSelection(new Map(), {
    ...single,
    image: sea,
    checked: true,
  });

  const next = changeSelection(first, {
    ...single,
    image: hill,
    checked: true,
  });

  expect(availableImages(next, single)).toEqual([hill]);
  expect(availableImages(first, single)).toEqual([sea]);
});

test("複数の画像を選んだ順で保持し、解除して選び直した画像は最後に置く", () => {
  const first = changeSelection(new Map(), {
    ...multiple,
    image: sea,
    checked: true,
  });

  const both = changeSelection(first, {
    ...multiple,
    image: hill,
    checked: true,
  });

  const afterRemoval = changeSelection(both, {
    ...multiple,
    image: sea,
    checked: false,
  });

  expect(availableImages(afterRemoval, multiple)).toEqual([hill]);
  expect(
    availableImages(
      changeSelection(afterRemoval, { ...multiple, image: sea, checked: true }),
      multiple,
    ),
  ).toEqual([hill, sea]);
});

test("選んだ後で追加済み・削除済みになった画像は確定できず、次の選択からも外れる", () => {
  const both = new Map([
    [sea.id, sea],
    [hill.id, hill],
  ]);

  const options = {
    ...multiple,
    included: new Set([sea.id]),
    missing: new Set([hill.id]),
  };

  expect(availableImages(both, options)).toEqual([]);
  expect(
    availableImages(
      changeSelection(both, { ...options, image: lake, checked: true }),
      multiple,
    ),
  ).toEqual([lake]);
});
