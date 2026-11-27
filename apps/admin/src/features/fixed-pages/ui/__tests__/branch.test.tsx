import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "bun:test";

import { Branch } from "../branch";

afterEach(cleanup);

test("追加のボタンへの枝には、補足を読み上げに伝える欄を置く", () => {
  const { rerender } = render(
    <Branch parent="repeat" target="add" note="追加できるのは100件までです">
      <button type="button">行を追加</button>
    </Branch>,
  );

  expect(screen.getByRole("status").textContent).toBe(
    "追加できるのは100件までです",
  );

  rerender(
    <Branch parent="repeat" target="add">
      <button type="button">行を追加</button>
    </Branch>,
  );

  expect(screen.getByRole("status").textContent).toBe("");
});

test("見出しや要素への枝には、補足の欄を置かない", () => {
  render(
    <Branch parent="group" target="item">
      <p>名前</p>
    </Branch>,
  );

  expect(screen.queryByRole("status")).toBeNull();
  expect(screen.getByText("名前")).toBeDefined();
});
