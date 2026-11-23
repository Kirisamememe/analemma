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

const wait = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

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

  test("token を見せている間は、backdrop を押しても閉じず、Escape では閉じる", async () => {
    renderIssuing();

    await openAndSubmit("本番のデプロイ");
    await issuedToken();
    await userEvent.click(document.body);

    expect(
      screen.getByRole("dialog", { name: "新しいトークンをコピー" }),
    ).toBeDefined();

    await userEvent.keyboard("{Escape}");

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).toBeNull();
    });
  });

  test("名前を入れている間は、backdrop を押すと閉じる", async () => {
    renderIssuing();
    await userEvent.click(
      await screen.findByRole("button", { name: "トークンを発行" }),
    );
    await screen.findByRole("dialog", { name: "トークンを発行" });
    await userEvent.click(document.body);

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).toBeNull();
    });
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

  test("再認証をキャンセルしたら、発行せずに Dialog を開いたままにし、知らせは出さない", async () => {
    const { server, app } = renderIssuing(
      createFakeAuthenticator({ authenticate: { _tag: "Cancelled" } }),
    );

    const dialog = await openAndSubmit("本番のデプロイ");

    await waitFor(() => {
      expect(app.calls).toContain("admin/session/reauthenticationOptions");
      expect(
        within(dialog).getByRole("button", { name: "トークンを発行" }),
      ).toHaveProperty("disabled", false);
    });
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.getByRole("dialog", { name: "トークンを発行" })).toBe(dialog);
    expect(app.calls).not.toContain("admin/deployTokens/issue");
    expect(server.tokens()).toEqual([]);
  });

  test("server が再認証を断ったら、Dialog を開いたまま Toast で知らせる", async () => {
    const { server } = renderIssuing();

    server.replyNext("admin/deployTokens/issue", () => ({
      error: "REAUTHENTICATION_FAILED",
    }));

    const dialog = await openAndSubmit("本番のデプロイ");

    expect((await screen.findByRole("alert")).textContent).toBe(
      "本人確認ができませんでした。",
    );
    expect(screen.getByRole("dialog", { name: "トークンを発行" })).toBe(dialog);
    expect(server.tokens()).toEqual([]);
  });

  test("想定外の失敗は、Dialog を開いたまま Toast で知らせる", async () => {
    const { server } = renderIssuing();

    server.replyNext("admin/deployTokens/issue", () => ({
      error: "INTERNAL_SERVER_ERROR",
      defined: false,
    }));

    const dialog = await openAndSubmit("本番のデプロイ");

    expect((await screen.findByRole("alert")).textContent).toBe(
      "操作できませんでした。時間をおいて、もう一度試してください。",
    );
    expect(screen.getByRole("dialog", { name: "トークンを発行" })).toBe(dialog);
  });

  test("名前が決まりに合わなければ、再認証の前に入力欄に focus を移して知らせる", async () => {
    const { app } = renderIssuing();

    const dialog = await openAndSubmit("   ");

    const name = within(dialog).getByRole("textbox", {
      name: "トークンの名前",
    });

    expect(
      await within(dialog).findByText(
        "1〜64文字で、改行などを使わずに付けてください。",
      ),
    ).toBeDefined();
    await waitFor(() => {
      expect(document.activeElement).toBe(name);
    });
    expect(app.calls).not.toContain("admin/session/reauthenticationOptions");
  });

  test("名前の誤りは、送るまでは focus が外れても出さず、送った後は入力すると消す", async () => {
    renderIssuing();
    await userEvent.click(
      await screen.findByRole("button", { name: "トークンを発行" }),
    );

    const dialog = await screen.findByRole("dialog", {
      name: "トークンを発行",
    });

    const name = within(dialog).getByRole("textbox", {
      name: "トークンの名前",
    });

    const problem = "1〜64文字で、改行などを使わずに付けてください。";

    await userEvent.click(name);
    await userEvent.tab();

    expect(within(dialog).queryByText(problem)).toBeNull();

    await userEvent.click(
      within(dialog).getByRole("button", { name: "トークンを発行" }),
    );

    expect(await within(dialog).findByText(problem)).toBeDefined();

    await userEvent.type(name, "本番");

    expect(within(dialog).queryByText(problem)).toBeNull();
  });

  test("コピーを押すと、token をクリップボードに書いてボタンの文言で知らせ、最後のコピーが成功してから2秒で文言を戻す", async () => {
    const write = spyOn(navigator.clipboard, "writeText").mockResolvedValue(
      undefined,
    );

    renderIssuing();
    await openAndSubmit("本番のデプロイ");

    const token = await issuedToken();

    await userEvent.click(screen.getByRole("button", { name: "コピー" }));

    const copied = await screen.findByRole("button", {
      name: "コピーしました",
    });

    expect(document.activeElement).toBe(copied);
    expect(write).toHaveBeenCalledWith(token);
    expect(screen.queryByRole("alert")).toBeNull();

    await wait(1000);
    await userEvent.click(copied); // 1回目の2秒の timer が、押し直した結果を消さない
    await wait(1300);
    expect(screen.getByRole("button", { name: "コピーしました" })).toBe(copied);
    await waitFor(
      () => {
        expect(document.activeElement).toBe(
          screen.getByRole("button", { name: "コピー" }),
        );
      },
      { timeout: 2000 },
    );
    write.mockRestore();
  });

  test("クリップボードに書けなければ、ボタンの文言で知らせ、押し直すまで残す", async () => {
    const write = spyOn(navigator.clipboard, "writeText").mockRejectedValue(
      new DOMException("denied", "NotAllowedError"),
    );

    renderIssuing();
    await openAndSubmit("本番のデプロイ");
    await issuedToken();
    await userEvent.click(screen.getByRole("button", { name: "コピー" }));

    expect(
      await screen.findByRole("button", { name: "コピーできませんでした" }),
    ).toBeDefined();
    await wait(2100);
    expect(
      screen.getByRole("button", { name: "コピーできませんでした" }),
    ).toBeDefined();

    write.mockResolvedValue(undefined);
    await userEvent.click(
      screen.getByRole("button", { name: "コピーできませんでした" }),
    );
    expect(
      await screen.findByRole("button", { name: "コピーしました" }),
    ).toBeDefined();
    write.mockRestore();
  });
});
