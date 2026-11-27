import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "bun:test";

import { TransferProgress } from "../transfer-progress";

afterEach(cleanup);

test.each([0, 64, 100])(
  "送信済みの割合(%p%)を、ファイルの名前の付いた progress で伝える",
  (percent) => {
    render(<TransferProgress label="lake.jpg" percent={percent} />);

    expect(
      screen
        .getByRole("progressbar", { name: "lake.jpg" })
        .getAttribute("value"),
    ).toBe(String(percent));
  },
);
