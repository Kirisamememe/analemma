import { cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test } from "bun:test";

import { createImageRoutes } from "@/testing/fake-routes/create-image-routes";
import { renderApp } from "@/testing/render-app";

afterEach(cleanup);

test("移った写真の前後とも無いときは、一覧へのリンクに focus を戻す", async () => {
  const server = createImageRoutes([
    { title: "夕暮れの稜線" },
    { title: "港の灯り" },
  ]);

  renderApp({
    path: "/images/" + (server.images()[0]?.id ?? ""),
    routes: server.routes,
  });
  await screen.findByRole("heading", { name: "夕暮れの稜線" });
  server.replyNext("admin/images/neighbors", () => ({
    output: { newer: null, older: null },
  }));
  const next = await screen.findByRole("link", { name: "次の画像" });
  next.focus();
  await userEvent.keyboard("{Enter}");
  await screen.findByRole("heading", { name: "港の灯り" });
  await waitFor(() => {
    expect(document.activeElement).toBe(
      screen.getByRole("link", { name: "画像の一覧" }),
    );
  });
});
