import { cleanup, screen } from "@testing-library/react";
import { afterEach, expect, test } from "bun:test";

import { renderApp } from "@/testing/render-app";

afterEach(cleanup);

const session = {
  "admin/session/get": () => ({
    output: { expiresAt: "2026-11-23T00:00:00.000Z" },
  }),
};

test("選んだ種類が無いときはフォームを出さずに知らせる", async () => {
  renderApp({
    path: "/fixed-pages/new?kind=missing",
    routes: { ...session, "admin/kinds/get": () => ({ error: "NOT_FOUND" }) },
  });
  expect(await screen.findByText("この種類はもうありません。")).toBeDefined();
  expect(screen.queryByRole("button", { name: "保存" })).toBeNull();
});
