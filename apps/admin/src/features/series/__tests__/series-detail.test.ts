import { act, cleanup, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test } from "bun:test";

import { createSeriesRoutes } from "@/testing/fake-routes/create-series-routes";
import { renderApp } from "@/testing/render-app";
afterEach(cleanup);

const button = (name: string) => screen.getByRole("button", { name });
const dialog = () => within(screen.getByRole("dialog"));

test("シリーズの名前・slug・説明を保存すると詳細に反映され、編集のボタンに focus が戻る", async () => {
  renderApp({ path: "/series", routes: createSeriesRoutes() });
  await userEvent.click(await screen.findByRole("link", { name: "旅の写真" }));
  await userEvent.click(
    await screen.findByRole("button", { name: "シリーズを編集" }),
  );
  const name = dialog().getByRole("textbox", { name: /名前/v });
  await userEvent.clear(name);
  await userEvent.type(name, "旅日記");
  const slug = dialog().getByRole("textbox", { name: /slug/v });
  await userEvent.clear(slug);
  await userEvent.type(slug, "journey");
  await userEvent.type(
    dialog().getByRole("textbox", { name: "説明" }),
    "冬の旅",
  );
  await userEvent.click(button("保存"));

  await screen.findByText("シリーズを保存しました。");
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(screen.getByRole("heading", { name: "旅日記" })).toBeDefined();
  await waitFor(() => {
    expect(button("シリーズを編集").matches(":focus")).toBe(true);
  });
  expect(screen.getByText("journey")).toBeDefined();
  expect(screen.getByText("冬の旅")).toBeDefined();
});

test("保存中に離れて同じシリーズを開き直しても、次の編集は保存済みの名前から始まる", async () => {
  const routes = createSeriesRoutes();
  const pending = Promise.withResolvers<undefined>();

  const { history } = renderApp({
    path: "/series",
    routes: {
      ...routes,
      "admin/series/update": async (input) => {
        await pending.promise;
        return routes["admin/series/update"](input);
      },
    },
  });

  await userEvent.click(await screen.findByRole("link", { name: "旅の写真" }));
  await userEvent.click(
    await screen.findByRole("button", { name: "シリーズを編集" }),
  );
  const name = dialog().getByRole("textbox", { name: /名前/v });
  await userEvent.clear(name);
  await userEvent.type(name, "冬の旅");
  await userEvent.click(button("保存"));
  act(() => {
    history.push("/series");
  });
  await userEvent.click(
    await screen.findByRole("button", { name: "画面を離れる" }),
  );
  await userEvent.click(await screen.findByRole("link", { name: "旅の写真" }));
  const edit = await screen.findByRole("button", { name: /シリーズを編集/v });
  await userEvent.click(edit);
  expect(screen.queryByRole("dialog")).toBeNull();
  pending.resolve(undefined);
  await screen.findByText("シリーズを保存しました。");
  await userEvent.click(button("シリーズを編集"));
  expect(dialog().getByDisplayValue("冬の旅")).toBeDefined();
});
