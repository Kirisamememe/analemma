import { act, cleanup, screen, within } from "@testing-library/react";
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

test("削除の応答を待つ間に別のシリーズを開くと、そのシリーズの編集を続けられる", async () => {
  const routes = createSeriesRoutes();
  routes["admin/series/create"]({
    name: "冬景色",
    slug: "winter",
    description: null,
  });
  const pending = Promise.withResolvers<undefined>();

  const { history } = renderApp({
    path: "/series",
    routes: {
      ...routes,
      "admin/series/delete": async (input) => {
        await pending.promise;
        return routes["admin/series/delete"](input);
      },
    },
  });

  await userEvent.click(await screen.findByRole("link", { name: "旅の写真" }));
  await userEvent.click(await screen.findByRole("button", { name: "削除" }));
  await userEvent.click(
    within(
      screen.getByRole("dialog", { description: /元に戻せません/v }),
    ).getByRole("button", { name: "削除" }),
  );
  act(() => {
    history.back();
  });
  await userEvent.click(await screen.findByRole("link", { name: "冬景色" }));
  await userEvent.click(
    await screen.findByRole("button", { name: "シリーズを編集" }),
  );
  await userEvent.type(screen.getByRole("textbox", { name: "説明" }), "雪の朝");
  pending.resolve(undefined);
  await screen.findByText(/旅の写真.*削除しました/v);
  expect(screen.getByDisplayValue("雪の朝")).toBeDefined();
  expect(screen.queryByText("保存していない変更があります")).toBeNull();
});

test("詳細の公開を待つ間に一覧へ戻ると、表示中の行にも公開状態が反映される", async () => {
  const routes = createSeriesRoutes();
  const pending = Promise.withResolvers<undefined>();
  renderApp({
    path,
    routes: {
      ...routes,
      "admin/series/publish": async (input) => {
        await pending.promise;
        return routes["admin/series/publish"](input);
      },
    },
  });
  await userEvent.click(
    await screen.findByRole("button", { name: "公開する" }),
  );
  expect(await screen.findByRole("progressbar")).toBeDefined();
  await userEvent.click(screen.getByRole("link", { name: "シリーズの一覧" }));
  await screen.findByText("非公開");
  pending.resolve(undefined);
  await screen.findByText("公開中");
});
