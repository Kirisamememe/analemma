import { cleanup, screen } from "@testing-library/react";
import { afterEach, expect, test } from "bun:test";

import { ImageRowsPlaceholder } from "@/components/images/ui/image-rows-placeholder";
import { renderWithI18n } from "@/testing/render-with-i18n";

afterEach(cleanup);

test("読み込みが続くと知らせ、灰色の枠は読み上げない", async () => {
  renderWithI18n(<ImageRowsPlaceholder label="画像を読み込んでいます。" />);

  expect(screen.getByRole("status").textContent).toBe("");
  expect(await screen.findByText("画像を読み込んでいます。")).toBeDefined();
  expect(screen.queryByRole("list")).toBeNull();
});
