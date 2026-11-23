import { describe, expect, test } from "bun:test";

import { orderPages } from "@/features/fixed-pages/list/logic/order-pages";

const page = (id: string) => ({ id });

describe("orderPages", () => {
  test("送っている並びが無ければ、server の並びのまま返す", () => {
    const pages = [page("a"), page("b")];

    expect(orderPages(pages, undefined)).toBe(pages);
  });

  test("送っている並びの順に並べ、後から増えた行は server の順で後ろに付ける", () => {
    expect(
      orderPages(
        [page("a"), page("x"), page("b"), page("y"), page("c")],
        ["c", "a", "b"],
      ).map(({ id }) => id),
    ).toEqual(["c", "a", "b", "x", "y"]);
  });

  test("送った後に消えた行は飛ばす", () => {
    expect(
      orderPages([page("a"), page("c")], ["c", "b", "a"]).map(({ id }) => id),
    ).toEqual(["c", "a"]);
  });
});
