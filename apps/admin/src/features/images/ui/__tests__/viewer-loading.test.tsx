import { cleanup, within } from "@testing-library/react";
import { afterEach, expect, test } from "bun:test";

import { ViewerLoading } from "@/features/images/ui/viewer-loading";
import { renderWithI18n } from "@/testing/render-with-i18n";

afterEach(cleanup);

test("写真の情報を待つ間は、骨組みを読ませずに読み込み中の通知を出す", async () => {
  const { container } = renderWithI18n(<ViewerLoading />, "ja");
  const screen = within(container);

  expect(screen.queryByRole("img")).toBeNull();
  expect(
    screen
      .getByRole("status")
      .contains(await screen.findByText("画像を読み込んでいます。")),
  ).toBe(true);
});
