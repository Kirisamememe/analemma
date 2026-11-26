import { cleanup, render, within } from "@testing-library/react";
import { afterEach, expect, test } from "bun:test";

import { OverlayLayer } from "../overlay-layer";

afterEach(cleanup);

test("本文に重ねた案内はページ遷移する内容の外に置き、案内を閉じたら取り除く", () => {
  const main = document.createElement("main");
  const transition = document.createElement("div");
  main.append(transition);

  const view = render(
    <OverlayLayer container={main}>ここにドロップ</OverlayLayer>,
    {
      container: transition,
    },
  );

  expect(within(main).getByText("ここにドロップ")).toBeDefined();
  expect(within(transition).queryByText("ここにドロップ")).toBeNull();
  view.unmount();
  expect(within(main).queryByText("ここにドロップ")).toBeNull();
});
