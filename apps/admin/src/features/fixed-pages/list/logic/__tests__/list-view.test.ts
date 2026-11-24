import { describe, expect, test } from "bun:test";

import { fixedPagesView, kindLabels } from "../list-view";

import { kind } from "@/testing/fixed-page-samples";

const view = (overrides: Partial<Parameters<typeof fixedPagesView>[0]>) =>
  fixedPagesView({
    pages: "Loaded",
    kinds: "Loaded",
    kindsRetrying: false,
    rows: 2,
    ...overrides,
  });

describe("fixedPagesView", () => {
  test("種類のラベルが届くまでは、行を出さずに読み込み中にする", () => {
    expect(view({ kinds: "Loading" })).toBe("Loading");
    expect(view({ kinds: "Failed", kindsRetrying: true })).toBe("Loading");
  });

  test("固定ページを読めなければ、種類の一覧によらず、読めなかった欄を出す", () => {
    expect(view({ pages: "Failed", kinds: "Failed" })).toBe("Failed");
  });

  test("種類の一覧だけを読めないときは、行を出す", () => {
    expect(view({ kinds: "Failed" })).toBe("Rows");
    expect(view({ rows: 0 })).toBe("Empty");
  });
});

test("種類の名前からラベルを引き、読めていなければ空の表にする", () => {
  expect(kindLabels([kind]).get(kind.name)).toBe(kind.label);
  expect(kindLabels(undefined).size).toBe(0);
});
