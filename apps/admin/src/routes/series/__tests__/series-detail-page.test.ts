import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test } from "bun:test";

import {
  createSeriesRoutes,
  SAMPLE_SERIES_ID,
} from "@/testing/fake-routes/create-series-routes";
import { renderApp } from "@/testing/render-app";

afterEach(cleanup);
const path = `/series/${SAMPLE_SERIES_ID}`;

test("削除されたシリーズは画面内で知らせ、一覧に戻れる", async () => {
  renderApp({ path, routes: createSeriesRoutes("none") });
  await screen.findByText("このシリーズはもうありません。");
  expect(screen.queryByRole("button", { name: /再試行/v })).toBeNull();
  await userEvent.click(screen.getByRole("link", { name: "シリーズの一覧" }));
  await screen.findByText("シリーズはまだありません");
});
