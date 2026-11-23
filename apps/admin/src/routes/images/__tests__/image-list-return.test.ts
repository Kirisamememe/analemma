import { act, cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test } from "bun:test";

import type { FakeReply } from "@/testing/create-fake-api";
import { createImageRoutes } from "@/testing/fake-routes/create-image-routes";
import { renderApp } from "@/testing/render-app";

afterEach(cleanup);

const paged = () =>
  createImageRoutes(
    Array.from({ length: 52 }, (_, index) => ({ title: `写真 ${index + 1}` })),
  );

const more = () => screen.findByRole("button", { name: "さらに読み込む" });

test("写真から戻ると、続きを読み直さずに元の写真へ戻り、別のタブへ出た後は最初から読む", async () => {
  const server = paged();

  const { calls, history } = renderApp({
    path: "/Images/",
    routes: server.routes,
  });

  const lists = () =>
    calls.filter((path) => path === "admin/images/list").length;

  const user = userEvent.setup();

  await user.click(await more());
  await user.click(await screen.findByRole("link", { name: /写真 52/v }));
  await screen.findByRole("heading", { name: "写真 52" });
  await user.click(screen.getByRole("link", { name: "画像の一覧" }));

  const selected = await screen.findByRole("link", {
    name: /写真 52/v,
  });

  await waitFor(() => {
    expect(document.activeElement === selected).toBe(true);
  });
  expect(lists()).toBe(2);

  act(() => {
    history.replace("/Images/");
  });
  await user.click(screen.getByRole("link", { name: "ホーム" }));
  await user.click(await screen.findByRole("link", { name: "画像" }));
  await more();
  expect(screen.queryByRole("link", { name: /写真 52/v })).toBeNull();
  expect(lists()).toBe(3);
});

test("続きを読めなかった後に写真から戻っても、元の50枚を見ながら続きを取り直せる", async () => {
  const server = paged();

  let disconnected = true;
  const user = userEvent.setup();
  renderApp({
    path: "/images",
    routes: {
      ...server.routes,
      "admin/images/list": (input) =>
        disconnected && input.cursor !== undefined
          ? { error: "INTERNAL_SERVER_ERROR", defined: false }
          : server.routes["admin/images/list"](input),
    },
  });
  await user.click(await more());
  await screen.findByRole(
    "heading",
    { name: "続きの画像を読み込めませんでした" },
    { timeout: 8000 },
  );
  await user.click(screen.getByRole("link", { name: /写真 50/v }));
  await screen.findByRole("heading", { name: "写真 50" });
  await user.click(screen.getByRole("link", { name: "画像の一覧" }));
  await screen.findByRole("link", { name: /写真 50/v });
  disconnected = false;
  await user.click(await screen.findByRole("button", { name: "もう一度試す" }));
  await screen.findByRole("link", { name: /写真 52/v });
}, 15_000);

test("画像一覧を裏で更新できなくても、写真を残してその場で取り直せる", async () => {
  const server = createImageRoutes([{ title: "山の朝" }]);
  let offline = false;

  const { queryClient } = renderApp({
    path: "/images",
    routes: {
      ...server.routes,
      "admin/images/list": (input) =>
        offline
          ? { error: "INTERNAL_SERVER_ERROR", defined: false }
          : server.routes["admin/images/list"](input),
    },
  });

  await screen.findByRole("link", { name: /山の朝/v });
  offline = true;
  await act(async () => {
    await queryClient.invalidateQueries();
  });
  expect(screen.getByRole("link", { name: /山の朝/v })).toBeDefined();
  await screen.findByRole("heading", {
    name: "画像の一覧を更新できませんでした",
  });
  offline = false;
  await userEvent.click(screen.getByRole("button", { name: "もう一度試す" }));
  await waitFor(() => {
    expect(
      screen.queryByRole("heading", {
        name: "画像の一覧を更新できませんでした",
      }),
    ).toBeNull();
  });
  expect(document.activeElement).toBe(
    screen.getByRole("link", { name: /山の朝/v }),
  );
}, 15_000);

test("セッション確認中も保存済みの一覧を表示し、失効の応答が届いたら消す", async () => {
  const server = createImageRoutes([{ title: "未公開の山", published: false }]);
  const check = Promise.withResolvers<FakeReply<"admin/session/get">>();
  const { queryClient } = renderApp({ path: "/images", routes: server.routes });

  await userEvent.click(
    await screen.findByRole("link", { name: /未公開の山/v }),
  );
  await screen.findByRole("heading", { name: "未公開の山" });
  server.replyNext("admin/session/get", () => check.promise);
  await userEvent.click(screen.getByRole("link", { name: "画像の一覧" }));
  await screen.findByRole("link", { name: /未公開の山/v });
  act(() => {
    check.resolve({ error: "UNAUTHORIZED" });
  });
  await screen.findByRole("heading", { name: "Stilus にログイン" });
  expect(screen.queryByRole("link", { name: /未公開の山/v })).toBeNull();
  expect(queryClient.getQueryData(["admin", "images", "list"])).toBeUndefined();
});
