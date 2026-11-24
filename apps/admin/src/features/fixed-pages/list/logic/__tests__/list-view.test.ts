import { describe, expect, mock, test } from "bun:test";

import { fixedPagesView, kindLabels } from "../list-view";

import type { ApiQueryResult } from "@/api/server-state/server-state";
import { kind } from "@/testing/fixed-page-samples";

const loaded: ApiQueryResult<unknown> = { _tag: "Loaded", data: {} };
const loading: ApiQueryResult<unknown> = { _tag: "Loading" };

const failed = (isRetrying = false) => {
  const retry = mock(() => undefined);
  const query: ApiQueryResult<unknown> = { _tag: "Failed", isRetrying, retry };

  return { query, retry };
};

describe("fixedPagesView", () => {
  test("種類のラベルが届くまでは、行を出さずに読み込み中にする", () => {
    expect(
      fixedPagesView({ pages: loaded, kinds: loading, rows: ["a"] })._tag,
    ).toBe("Loading");
    expect(
      fixedPagesView({ pages: loaded, kinds: failed(true).query, rows: ["a"] })
        ._tag,
    ).toBe("Loading");
  });

  test("固定ページを読めなければ、読めていない種類の一覧も一緒に取り直す", () => {
    const pages = failed();
    const kinds = failed(true);

    const view = fixedPagesView({
      pages: pages.query,
      kinds: kinds.query,
      rows: [],
    });

    expect(view).toMatchObject({ _tag: "Failed", isRetrying: true });

    if (view._tag === "Failed") view.retry();

    expect(pages.retry).toHaveBeenCalledTimes(1);
    expect(kinds.retry).toHaveBeenCalledTimes(1);
  });

  test("種類の一覧だけを読めないときは、行を出し、行が無ければ空にする", () => {
    expect(
      fixedPagesView({ pages: loaded, kinds: failed().query, rows: ["a"] }),
    ).toEqual({ _tag: "Rows", rows: ["a"] });
    expect(
      fixedPagesView({ pages: loaded, kinds: loaded, rows: [] })._tag,
    ).toBe("Empty");
  });
});

test("種類の名前からラベルを引き、読めていなければ空の表にする", () => {
  expect(kindLabels([kind]).get(kind.name)).toBe(kind.label);
  expect(kindLabels(undefined).size).toBe(0);
});
