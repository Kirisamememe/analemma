import { act, cleanup, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test } from "bun:test";

import {
  createSeriesRoutes,
  SAMPLE_SERIES_ID,
} from "@/testing/fake-routes/create-series-routes";
import { renderApp } from "@/testing/render-app";
afterEach(cleanup);

const path = `/series/${SAMPLE_SERIES_ID}`;
const button = (name: string) => screen.getByRole("button", { name });
const dialog = () => within(screen.getByRole("dialog"));

const dragFirst = async (): Promise<void> => {
  const user = userEvent.setup();
  await user.click(await screen.findByRole("row", { name: "夕暮れの稜線" }));
  await user.keyboard("{Tab}{Enter}{ArrowDown}{Enter}");
};

test("キーボードで置くとすぐに保存し、一覧のカバーも入れ替わる", async () => {
  renderApp({ path, routes: createSeriesRoutes() });
  await dragFirst();
  await screen.findByText("並び順を保存しました。");
  await userEvent.click(screen.getByRole("link", { name: "シリーズの一覧" }));

  const cover = await within(screen.getByRole("main")).findByRole(
    "presentation",
  );

  expect(cover.getAttribute("src")).toContain("morning-lake");
});

test("画像がほかで外されたときは並び順の競合を知らせ、取り直した画像で続けられる", async () => {
  const routes = createSeriesRoutes();
  renderApp({
    path,
    routes: {
      ...routes,
      "admin/series/reorder": (input) => {
        routes["admin/series/removeImages"]({
          id: input.id,
          imageIds: input.imageIds.slice(-1),
        });

        return routes["admin/series/reorder"](input);
      },
    },
  });
  await dragFirst();
  await screen.findByText(/画像の構成が変わった/v);
  expect(screen.getAllByRole("row")).toHaveLength(2);
  expect(screen.queryByRole("row", { name: "港の灯り" })).toBeNull();
});

test("画像を選ぶ Dialog はキャンセルで追加に戻り、確定すれば非公開の写真も追加・取り外しできる", async () => {
  renderApp({ path, routes: createSeriesRoutes("empty") });
  await screen.findByText("このシリーズにはまだ画像がありません");
  const add = button("画像を追加");
  await userEvent.click(add);
  await userEvent.keyboard("{Escape}");
  await waitFor(() => {
    expect(document.activeElement).toBe(add);
  });
  await userEvent.click(add);
  await userEvent.click(
    await screen.findByRole("checkbox", { name: /港の灯り/v }),
  );
  await userEvent.click(button("選択を確定"));
  const row = await screen.findByRole("row", { name: "港の灯り" });
  expect(within(row).getByText("非公開")).toBeDefined();
  await waitFor(() => {
    expect(add.matches(":focus")).toBe(true);
  });
  await userEvent.click(
    within(row).getByRole("button", { name: "「港の灯り」をシリーズから外す" }),
  );
  await screen.findByText("このシリーズにはまだ画像がありません");
  await waitFor(() => {
    expect(add.matches(":focus")).toBe(true);
  });
});

test("詳細の編集・公開切り替え・削除が一覧に反映され、削除後は追加の行に focus が移る", async () => {
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
  await userEvent.click(button("公開する"));
  await screen.findByText("公開中");
  await userEvent.click(button("非公開にする"));
  await screen.findByRole("button", { name: "公開する" });
  await userEvent.click(button("削除"));
  await userEvent.click(dialog().getByRole("button", { name: "キャンセル" }));
  expect(screen.getByRole("heading", { name: "旅日記" })).toBeDefined();
  await waitFor(() => {
    expect(button("削除").matches(":focus")).toBe(true);
  });
  await userEvent.click(button("削除"));
  await userEvent.click(dialog().getByRole("button", { name: "削除" }));
  await screen.findByText("シリーズはまだありません");
  await waitFor(() => {
    expect(button("新しいシリーズ").matches(":focus")).toBe(true);
  });
});

test("追加時に削除された写真だけを選択から外し、残った写真を再確定できる", async () => {
  const routes = createSeriesRoutes("empty");
  let first = true;
  renderApp({
    path,
    routes: {
      ...routes,
      "admin/series/addImages": (input) => {
        const [id] = input.imageIds;

        if (first && id !== undefined) {
          routes["admin/images/delete"]({ id });
          first = false;
        }

        return routes["admin/series/addImages"](input);
      },
    },
  });
  await userEvent.click(
    await screen.findByRole("button", { name: "画像を追加" }),
  );
  await userEvent.click(
    await screen.findByRole("checkbox", { name: /夕暮れの稜線/v }),
  );
  await userEvent.click(screen.getByRole("checkbox", { name: /港の灯り/v }));
  await userEvent.click(button("選択を確定"));
  await screen.findByText(/削除された画像を選択から外しました/v);
  expect(dialog().getByText("選択中の画像 1 枚")).toBeDefined();
  expect(
    dialog().queryByRole("checkbox", { name: /夕暮れの稜線/v }),
  ).toBeNull();
  expect(
    dialog().getByRole("checkbox", { name: /港の灯り/v, checked: true }),
  ).toBeDefined();
  await userEvent.click(button("選択を確定"));
  await screen.findByRole("row", { name: "港の灯り" });
  expect(screen.queryByText(/削除された画像を選択から外しました/v)).toBeNull();
});

test("削除に失敗して確認の Dialog を閉じると失敗の Toast も消える", async () => {
  renderApp({
    path,
    routes: {
      ...createSeriesRoutes(),
      "admin/series/delete": () => ({
        error: "INTERNAL_SERVER_ERROR",
        defined: false,
      }),
    },
  });
  await userEvent.click(await screen.findByRole("button", { name: "削除" }));
  await userEvent.click(dialog().getByRole("button", { name: "削除" }));
  await screen.findByText(/シリーズの変更を保存できませんでした/v);
  await userEvent.keyboard("{Escape}");
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(
    screen.queryByText(/シリーズの変更を保存できませんでした/v),
  ).toBeNull();
});

test("撮影日のある無題の写真は行と取り外しのボタンに日付と位置が付く", async () => {
  renderApp({ path, routes: createSeriesRoutes() });

  const row = await screen.findByRole("row", {
    name: /無題.*2025.*4.*28.*2 枚目/v,
  });

  expect(
    within(row).getByRole("button", { name: /2025.*4.*28.*シリーズから外す/v }),
  ).toBeDefined();
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
