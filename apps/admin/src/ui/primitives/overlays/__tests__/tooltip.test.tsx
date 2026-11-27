import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test } from "bun:test";

import { Tooltip } from "../tooltip";

import { renderWithI18n } from "@/testing/render-with-i18n";
import { Button } from "@/ui/primitives/button";

afterEach(cleanup);

test("キーボードで操作に focus すると名前を出し、Escape で隠す", async () => {
  renderWithI18n(
    <Tooltip label="送り直す">
      <Button aria-label="lake.jpg を送り直す" icon="rotate-cw" />
    </Tooltip>,
    "ja",
  );

  expect(screen.queryByRole("tooltip")).toBeNull();

  await userEvent.tab();

  expect((await screen.findByRole("tooltip")).textContent).toBe("送り直す");

  await userEvent.keyboard("{Escape}");

  expect(screen.queryByRole("tooltip")).toBeNull();
});
