import { cleanup, screen } from "@testing-library/react";
import { afterEach, expect, test } from "bun:test";

import { renderWithI18n } from "@/testing/render-with-i18n";
import { ImageRowsPlaceholder } from "@/ui/patterns/photos/image-rows-placeholder";

afterEach(cleanup);

test("読み込みが続くと知らせ、灰色の枠は読み上げない", async () => {
  renderWithI18n(<ImageRowsPlaceholder label="画像を読み込んでいます。" />);

  expect(screen.getByRole("status").textContent).toBe("");
  expect(await screen.findByText("画像を読み込んでいます。")).toBeDefined();
  expect(screen.queryByRole("list")).toBeNull();
});
