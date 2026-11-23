import { cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test } from "bun:test";

import { createImageRoutes } from "@/testing/fake-routes/create-image-routes";
import { renderApp } from "@/testing/render-app";

afterEach(cleanup);

test("写真から戻ると、続きを読み直さずに元の写真へ戻り、別のタブへ出た後は最初から読む", async () => {
  const server = createImageRoutes(
    Array.from({ length: 52 }, (_, index) => ({ title: `写真 ${index + 1}` })),
  );

  const { calls } = renderApp({ path: "/images", routes: server.routes });

  const lists = () =>
    calls.filter((path) => path === "admin/images/list").length;

  const user = userEvent.setup();

  await user.click(
    await screen.findByRole("button", { name: "さらに読み込む" }),
  );
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

  await user.click(screen.getByRole("link", { name: "ホーム" }));
  await user.click(await screen.findByRole("link", { name: "画像" }));
  await screen.findByRole("button", { name: "さらに読み込む" });
  expect(screen.queryByRole("link", { name: /写真 52/v })).toBeNull();
  expect(lists()).toBe(3);
});
