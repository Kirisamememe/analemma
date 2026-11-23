import { cleanup, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, spyOn, test } from "bun:test";

import { createFakeAuthenticator } from "@/testing/create-fake-authenticator";
import { createDeployTokenRoutes } from "@/testing/fake-routes/create-deploy-token-routes";
import { renderApp } from "@/testing/render-app";

afterEach(cleanup);

const openAndSubmit = async (name: string): Promise<HTMLElement> => {
  await userEvent.click(
    await screen.findByRole("button", { name: "トークンを発行" }),
  );

  const dialog = await screen.findByRole("dialog", { name: "トークンを発行" });

  await userEvent.type(
    within(dialog).getByRole("textbox", { name: "トークンの名前" }),
    name,
  );
  await userEvent.click(
    within(dialog).getByRole("button", { name: "トークンを発行" }),
  );

  return dialog;
};

const renderIssuing = (authenticator = createFakeAuthenticator()) => {
  const server = createDeployTokenRoutes([]);
  const app = renderApp({
    path: "/deploy-tokens",
    routes: server.routes,
    authenticator,
  });

  return { server, app };
};

const issuedToken = async (): Promise<string> => {
  const value = await screen.findByRole("textbox", {
    name: "「本番のデプロイ」のトークン",
  });

  return value instanceof HTMLTextAreaElement ? value.value : "";
};

const isShown = (token: string): boolean =>
  document.body.textContent.includes(token) ||
  screen
    .queryAllByRole("textbox")
    .some(
      (field) => field instanceof HTMLTextAreaElement && field.value === token,
    );

describe("IssueDeployTokenDialog", () => {
  test("再認証をしてから発行して token を見せ、閉じたら Toast で知らせ、一覧に足す", async () => {
    const { server, app } = renderIssuing();

    await openAndSubmit("本番のデプロイ");

    const token = await issuedToken();
    const dialog = await screen.findByRole("dialog", {
      name: "新しいトークンをコピー",
    });

    expect(token).toStartWith(`${server.tokens()[0]!.id}.`);
    expect(
      screen.getByText(
        "トークンの値を表示するのは今だけです。閉じる前にコピーしてください。",
      ),
    ).toBeDefined();
    expect(screen.queryByRole("alert")).toBeNull();

    await userEvent.click(
      within(dialog).getByRole("button", { name: "閉じる" }),
    );

    expect((await screen.findByRole("alert")).textContent).toBe(
      "「本番のデプロイ」を発行しました。",
    );
    expect(app.calls).toContain("admin/session/reauthenticationOptions");
    expect(app.calls).toContain("admin/deployTokens/issue");
    expect(
      await within(screen.getByRole("main")).findByText("本番のデプロイ"),
    ).toBeDefined();
  });

  test("閉じたら、token を画面・URL・query client のどこからも取り出せず、開き直すと名前の入力に戻る", async () => {
    const { app } = renderIssuing();

    await openAndSubmit("本番のデプロイ");

    const token = await issuedToken();

    await userEvent.click(
      within(
        screen.getByRole("dialog", { name: "新しいトークンをコピー" }),
      ).getByRole("button", { name: "閉じる" }),
    );
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).toBeNull();
    });

    const cached = JSON.stringify([
      app.queryClient
        .getQueryCache()
        .getAll()
        .map(({ state }) => state),
      app.queryClient
        .getMutationCache()
        .getAll()
        .map(({ state }) => state),
    ]);

    expect(isShown(token)).toBe(false);
    expect(app.history.location.href).not.toContain(token);
    expect(cached).not.toContain(token);
    expect(cached).not.toContain(token.split(".")[1]!);

    await userEvent.click(
      screen.getByRole("button", { name: "トークンを発行" }),
    );

    const reopened = await screen.findByRole("dialog", {
      name: "トークンを発行",
    });

    expect(
      within(reopened).getByRole("textbox", { name: "トークンの名前" }),
    ).toBeDefined();
    expect(isShown(token)).toBe(false);
  });

  test("再認証をキャンセルしたら、発行せずに Dialog を開いたまま知らせる", async () => {
    const { server, app } = renderIssuing(
      createFakeAuthenticator({ authenticate: { _tag: "Cancelled" } }),
    );

    const dialog = await openAndSubmit("本番のデプロイ");

    expect(
      await within(dialog).findByText("トークンの発行をキャンセルしました。"),
    ).toBeDefined();
    expect(app.calls).not.toContain("admin/deployTokens/issue");
    expect(server.tokens()).toEqual([]);
  });

  test("server が再認証を断ったら、Dialog を開いたまま知らせる", async () => {
    const { server } = renderIssuing();

    server.replyNext("admin/deployTokens/issue", () => ({
      error: "REAUTHENTICATION_FAILED",
    }));

    const dialog = await openAndSubmit("本番のデプロイ");

    expect((await within(dialog).findByRole("alert")).textContent).toBe(
      "本人確認ができませんでした。",
    );
    expect(server.tokens()).toEqual([]);
  });

  test("想定外の失敗は、Dialog を開いたまま知らせる", async () => {
    const { server } = renderIssuing();

    server.replyNext("admin/deployTokens/issue", () => ({
      error: "INTERNAL_SERVER_ERROR",
      defined: false,
    }));

    const dialog = await openAndSubmit("本番のデプロイ");

    expect((await within(dialog).findByRole("alert")).textContent).toBe(
      "操作できませんでした。時間をおいて、もう一度試してください。",
    );
  });

  test("名前が決まりに合わなければ、再認証の前に入力欄で知らせる", async () => {
    const { app } = renderIssuing();

    const dialog = await openAndSubmit("   ");

    expect(
      await within(dialog).findByText(
        "1〜64文字で、改行などを使わずに付けてください。",
      ),
    ).toBeDefined();
    expect(app.calls).not.toContain("admin/session/reauthenticationOptions");
  });

  test("コピーを押すと、token をクリップボードに書き、知らせる", async () => {
    const write = spyOn(navigator.clipboard, "writeText").mockResolvedValue(
      undefined,
    );

    renderIssuing();
    await openAndSubmit("本番のデプロイ");

    const token = await issuedToken();

    await userEvent.click(screen.getByRole("button", { name: "コピー" }));

    expect(
      await screen.findByText("トークンをクリップボードにコピーしました。"),
    ).toBeDefined();
    expect(write).toHaveBeenCalledWith(token);
    write.mockRestore();
  });

  test("クリップボードに書けなければ、手でコピーするよう知らせる", async () => {
    const write = spyOn(navigator.clipboard, "writeText").mockRejectedValue(
      new DOMException("denied", "NotAllowedError"),
    );

    renderIssuing();
    await openAndSubmit("本番のデプロイ");
    await issuedToken();
    await userEvent.click(screen.getByRole("button", { name: "コピー" }));

    expect(
      await screen.findByText(
        "コピーできませんでした。トークンを選んで、手でコピーしてください。",
      ),
    ).toBeDefined();
    write.mockRestore();
  });
});
