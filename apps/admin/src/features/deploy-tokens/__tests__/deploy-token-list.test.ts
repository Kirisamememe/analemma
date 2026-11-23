import { cleanup, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, test } from "bun:test";

import { formatDateTime } from "@/i18n/format-date-time";
import type { FakeReply } from "@/testing/create-fake-api";
import { createDeployTokenRoutes } from "@/testing/fake-routes/create-deploy-token-routes";
import { renderApp } from "@/testing/render-app";

afterEach(cleanup);

const LAST_USED_AT = "2026-02-03T04:05:00.000Z";

describe("DeployTokenList", () => {
  test("トークンごとに、名前と、発行した日時と最後に使った日時を出す", async () => {
    const server = createDeployTokenRoutes([
      { name: "本番のデプロイ", lastUsedAt: LAST_USED_AT },
      { name: "手元の確認", lastUsedAt: null },
    ]);

    renderApp({ path: "/deploy-tokens", routes: server.routes });

    const [used, unused] = await within(
      await screen.findByRole("main"),
    ).findAllByRole("listitem");

    const [first, second] = server.tokens();

    expect(within(used!).getByText("本番のデプロイ")).toBeDefined();
    expect(
      within(used!).getByText(
        `発行 ${formatDateTime("ja", first!.createdAt)}・最終使用 ${formatDateTime("ja", LAST_USED_AT)}`,
      ),
    ).toBeDefined();
    expect(within(unused!).getByText("手元の確認")).toBeDefined();
    expect(
      within(unused!).getByText(
        `発行 ${formatDateTime("ja", second!.createdAt)}・未使用`,
      ),
    ).toBeDefined();
  });

  test("取り消すボタンは、見える文言を「取り消す」のまま、名前でトークンを見分けられる", async () => {
    const server = createDeployTokenRoutes([
      { name: "本番のデプロイ", lastUsedAt: null },
      { name: "手元の確認", lastUsedAt: null },
    ]);

    renderApp({ path: "/deploy-tokens", routes: server.routes });

    const [first, second] = await within(
      await screen.findByRole("main"),
    ).findAllByRole("listitem");
    const revokeFirst = within(first!).getByRole("button", {
      name: "「本番のデプロイ」を取り消す",
    });

    expect(revokeFirst.textContent).toBe("取り消す");
    expect(
      within(second!).getByRole("button", { name: "「手元の確認」を取り消す" })
        .textContent,
    ).toBe("取り消す");
  });

  test("トークンが無ければ、発行を促す", async () => {
    const server = createDeployTokenRoutes([]);

    renderApp({ path: "/deploy-tokens", routes: server.routes });

    expect(
      await screen.findByRole("heading", { name: "トークンはまだありません" }),
    ).toBeDefined();
    expect(
      screen.getByText(
        "公開サイトのデプロイに使うトークンを発行してください。",
      ),
    ).toBeDefined();
    expect(within(screen.getByRole("main")).queryByRole("list")).toBeNull();
  });

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

    expect(
      await screen.findByText("トークンを読み込んでいます。"),
    ).toBeDefined();
  });

  test("一覧を読み込めなければ、そのことを知らせる", async () => {
    const server = createDeployTokenRoutes([]);

    renderApp({
      path: "/deploy-tokens",
      routes: {
        ...server.routes,
        "admin/deployTokens/list": () => ({
          error: "INTERNAL_SERVER_ERROR",
          defined: false,
        }),
      },
    });

    expect(
      (await screen.findByRole("alert", {}, { timeout: 5000 })).textContent,
    ).toBe("トークンを読み込めませんでした。");
  });
});
