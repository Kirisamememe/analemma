import { cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test } from "bun:test";

import { createSeriesRoutes } from "@/testing/fake-routes/create-series-routes";
import { renderApp } from "@/testing/render-app";
afterEach(cleanup);
test("新しいシリーズを作ると一覧に加わり、成功を知らせて追加の行に戻る", async () => {
  renderApp({ path: "/series", routes: createSeriesRoutes("none") });
  await screen.findByText("シリーズはまだありません");
  const trigger = screen.getByRole("button", { name: "新しいシリーズ" });
  await userEvent.click(trigger);
  await userEvent.type(screen.getByRole("textbox", { name: /名前/v }), "春");
  await userEvent.type(
    screen.getByRole("textbox", { name: /slug/v }),
    "spring",
  );
  await userEvent.click(screen.getByRole("button", { name: "保存" }));

  await screen.findByText("シリーズを保存しました。");
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(await screen.findByText("春")).toBeDefined();
  await waitFor(() => {
    expect(document.activeElement).toBe(trigger);
  });
});

test("保存に失敗しても入力を保ち、失敗の知らせを閉じて送り直せる", async () => {
  const routes = createSeriesRoutes("none");
  let failed = true;
  renderApp({
    path: "/series",
    routes: {
      ...routes,
      "admin/series/create": (fields) =>
        failed
          ? { error: "INTERNAL_SERVER_ERROR", defined: false }
          : routes["admin/series/create"](fields),
    },
  });
  await userEvent.click(
    await screen.findByRole("button", { name: "新しいシリーズ" }),
  );
  await userEvent.type(screen.getByRole("textbox", { name: /名前/v }), "花");
  await userEvent.type(
    screen.getByRole("textbox", { name: /slug/v }),
    "flowers",
  );
  await userEvent.click(screen.getByRole("button", { name: "保存" }));
  await screen.findByText(/シリーズを保存できませんでした/v);
  expect(screen.getByDisplayValue("花")).toBeDefined();
  expect(screen.getByDisplayValue("flowers")).toBeDefined();
  failed = false;
  await userEvent.click(screen.getByRole("button", { name: "保存" }));
  await screen.findByText("シリーズを保存しました。");
  expect(screen.queryByText(/シリーズを保存できませんでした/v)).toBeNull();
});

test("使用中の slug を知らせ、ほかの値を保ったまま slug を直して保存できる", async () => {
  renderApp({ path: "/series", routes: createSeriesRoutes() });
  await userEvent.click(
    await screen.findByRole("button", { name: "新しいシリーズ" }),
  );
  await userEvent.type(
    screen.getByRole("textbox", { name: /名前/v }),
    "冬景色",
  );
  await userEvent.type(
    screen.getByRole("textbox", { name: /slug/v }),
    "travel",
  );
  await userEvent.click(screen.getByRole("button", { name: "保存" }));
  await screen.findByText("この slug は、ほかのシリーズが使っています。");
  expect(screen.getByText(/シリーズを保存できませんでした/v)).toBeDefined();
  const slug = screen.getByRole("textbox", { name: /slug/v });
  await waitFor(() => {
    expect(slug.matches(":focus")).toBe(true);
  });
  await userEvent.type(slug, "-winter");
  await userEvent.click(screen.getByRole("button", { name: "保存" }));
  expect(await screen.findByText("シリーズを保存しました。")).toBeDefined();
});

test("Escape で変更を確かめ、編集を続けると入力が残り、破棄すると追加の行に戻る", async () => {
  renderApp({ path: "/series", routes: createSeriesRoutes() });
  const trigger = await screen.findByRole("button", { name: "新しいシリーズ" });
  await userEvent.click(trigger);
  await userEvent.type(screen.getByRole("textbox", { name: /名前/v }), "春");
  await userEvent.keyboard("{Escape}");
  await userEvent.click(
    await screen.findByRole("button", { name: "編集を続ける" }),
  );
  expect(screen.getByDisplayValue("春")).toBeDefined();
  await userEvent.click(screen.getByRole("button", { name: "キャンセル" }));
  await userEvent.click(screen.getByRole("button", { name: "変更を破棄" }));
  await waitFor(() => {
    expect(document.activeElement).toBe(trigger);
  });
});
