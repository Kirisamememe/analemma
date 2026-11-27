import { cleanup, screen } from "@testing-library/react";
import { afterEach, expect, test } from "bun:test";

import { TransferProgress } from "../transfer-progress";

import { renderWithI18n } from "@/testing/render-with-i18n";

afterEach(cleanup);

test.each([0, 64, 100])(
  "送信済みの割合(%p%)を、ファイルの名前の付いた progress で伝える",
  (percent) => {
    renderWithI18n(
      <TransferProgress label="lake.jpg" percent={percent} />,
      "ja",
    );

    expect(
      screen
        .getByRole("progressbar", { name: "lake.jpg" })
        .getAttribute("value"),
    ).toBe(String(percent));
  },
);
