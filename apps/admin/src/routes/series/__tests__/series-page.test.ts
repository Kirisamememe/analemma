import { cleanup, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test } from "bun:test";

import { createSeriesRoutes } from "@/testing/fake-routes/create-series-routes";
import { renderApp } from "@/testing/render-app";
afterEach(cleanup);
test("ナビからシリーズを開くと、カバーと画像の数と公開状態が分かる", async () => {
  renderApp({ path: "/", routes: createSeriesRoutes() });

  const navigation = (await screen.findAllByRole("navigation")).find(
    (nav) => within(nav).queryByRole("link", { name: "シリーズ" }) !== null,
  );

  if (navigation === undefined) throw new Error("ナビがありません");

  await userEvent.click(
    within(navigation).getByRole("link", { name: "シリーズ" }),
  );
  await screen.findByText("旅の写真");
  const row = within(screen.getByRole("main")).getByRole("listitem");
  expect(within(row).getByText("画像 3 枚")).toBeDefined();
  expect(within(row).getByText("非公開")).toBeDefined();
  expect(within(row).getByRole("img").getAttribute("src")).toContain(
    "dusk-ridge",
  );
});
