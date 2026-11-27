import { cleanup, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test } from "bun:test";

import { type FakeReply, wrapFakeRoute } from "@/testing/create-fake-api";
import { createDeployTokenRoutes } from "@/testing/fake-routes/create-deploy-token-routes";
import { renderApp } from "@/testing/render-app";

afterEach(cleanup);

describe("DeployTokenList", () => {
  test("読み込みを待つ間は、そのことを出す", async () => {
    const server = createDeployTokenRoutes([]);

    renderApp({
      path: "/deploy-tokens",
      routes: {
        ...server.routes,
        "admin/deployTokens/list": async () =>
          Promise.withResolvers<FakeReply<"admin/deployTokens/list">>().promise,
      },
    });

    expect(await screen.findByText("読み込んでいます")).toBeDefined();
  });

  test("一覧を読み込めなければ、そのことを知らせ、もう一度試すと一覧を出す", async () => {
    const server = createDeployTokenRoutes([
      { name: "本番のデプロイ", lastUsedAt: null },
    ]);

    const list = server.routes["admin/deployTokens/list"];
    let isListBroken = true;

    renderApp({
      path: "/deploy-tokens",
      routes: {
        ...server.routes,
        "admin/deployTokens/list": wrapFakeRoute(list, (input) =>
          isListBroken
            ? { error: "INTERNAL_SERVER_ERROR", defined: false }
            : list(input),
        ),
      },
    });

    const alert = await screen.findByRole("alert", {}, { timeout: 5000 });

    expect(
      within(alert).getByRole("heading", {
        name: "トークンを読み込めませんでした",
      }),
    ).toBeDefined();

    isListBroken = false;
    await userEvent.click(screen.getByRole("button", { name: "もう一度試す" }));

    expect(await screen.findByText("本番のデプロイ")).toBeDefined();
    expect(screen.queryByRole("alert")).toBeNull();
  });
});
