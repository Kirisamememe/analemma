import { describe, expect, test } from "bun:test";

import { orderItems } from "@/ui/primitives/collections/logic/order-items";

const page = (id: string) => ({ id });

describe("orderItems", () => {
  test("送っている並びが無ければ、server の並びのまま返す", () => {
    const pages = [page("a"), page("b")];

    expect(orderItems(pages, undefined)).toBe(pages);
  });

  test("送っている並びの順に並べ、後から増えた行は server の順で後ろに付ける", () => {
    expect(
      orderItems(
        [page("a"), page("x"), page("b"), page("y"), page("c")],
        ["c", "a", "b"],
      ).map(({ id }) => id),
    ).toEqual(["c", "a", "b", "x", "y"]);
  });

  test("送った後に消えた行は飛ばす", () => {
    expect(
      orderItems([page("a"), page("c")], ["c", "b", "a"]).map(({ id }) => id),
    ).toEqual(["c", "a"]);
  });
});
