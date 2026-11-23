import { cleanup, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test } from "bun:test";

import { createDeployTokenRoutes } from "@/testing/fake-routes/create-deploy-token-routes";
import { renderApp } from "@/testing/render-app";

afterEach(cleanup);

const renderTokens = () => {
  const server = createDeployTokenRoutes([
    { name: "本番のデプロイ", lastUsedAt: null },
    { name: "手元の確認", lastUsedAt: null },
  ]);

  const app = renderApp({ path: "/deploy-tokens", routes: server.routes });

  return { server, app };
};

const openRevoke = async (): Promise<HTMLElement> => {
  await userEvent.click(
    (await screen.findAllByRole("button", { name: "取り消す" }))[0]!,
  );

  return screen.findByRole("dialog", {
    name: "「本番のデプロイ」を取り消しますか?",
  });
};

describe("RevokeDeployTokenDialog", () => {
  test("確かめてから取り消すと、Dialog を閉じ、一覧から外し、Toast で知らせる", async () => {
    const { server, app } = renderTokens();

    const dialog = await openRevoke();

    await userEvent.click(
      within(dialog).getByRole("button", { name: "取り消す" }),
    );

    expect((await screen.findByRole("alert")).textContent).toBe(
      "「本番のデプロイ」を取り消しました。",
    );
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).toBeNull();
    });
    expect(screen.queryByText("本番のデプロイ")).toBeNull();
    expect(server.tokens().map(({ name }) => name)).toEqual(["手元の確認"]);
    expect(app.calls).not.toContain("admin/session/reauthenticationOptions");
  });

  test("キャンセルしたら、取り消さない", async () => {
    const { server, app } = renderTokens();

    const dialog = await openRevoke();

    await userEvent.click(
      within(dialog).getByRole("button", { name: "キャンセル" }),
    );

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).toBeNull();
    });
    expect(server.tokens()).toHaveLength(2);
    expect(app.calls).not.toContain("admin/deployTokens/revoke");
  });

  test("もう無いトークンなら、Dialog を開いたまま Toast で知らせ、一覧を取り直す", async () => {
    const { server, app } = renderTokens();

    const listCalls = (): number =>
      app.calls.filter((path) => path === "admin/deployTokens/list").length;

    server.replyNext("admin/deployTokens/revoke", () => ({
      error: "NOT_FOUND",
    }));

    const dialog = await openRevoke();
    const before = listCalls();

    await userEvent.click(
      within(dialog).getByRole("button", { name: "取り消す" }),
    );

    expect((await screen.findByRole("alert")).textContent).toBe(
      "このトークンはもうありません。",
    );
    expect(screen.getByRole("dialog")).toBe(dialog);
    expect(listCalls()).toBe(before + 1);
  });

  test("想定外の失敗は、Dialog を開いたまま Toast で知らせる", async () => {
    const { server } = renderTokens();

    server.replyNext("admin/deployTokens/revoke", () => ({
      error: "INTERNAL_SERVER_ERROR",
      defined: false,
    }));

    const dialog = await openRevoke();

    await userEvent.click(
      within(dialog).getByRole("button", { name: "取り消す" }),
    );

    expect((await screen.findByRole("alert")).textContent).toBe(
      "操作できませんでした。時間をおいて、もう一度試してください。",
    );
    expect(screen.getByRole("dialog")).toBe(dialog);
    expect(server.tokens()).toHaveLength(2);
  });
});
