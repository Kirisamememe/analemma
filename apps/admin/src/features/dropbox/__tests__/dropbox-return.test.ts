import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test } from "bun:test";

import { DROPBOX_REDIRECT_PATH } from "@analemma/contract";

import {
  createDropboxRoutes,
  FAKE_DROPBOX_RETURN,
} from "@/testing/fake-routes/create-dropbox-routes";
import { createImageRoutes } from "@/testing/fake-routes/create-image-routes";
import { renderApp } from "@/testing/render-app";

afterEach(cleanup);

const open = (search: string) =>
  renderApp({
    path: `${DROPBOX_REDIRECT_PATH}?${search}`,
    routes: { ...createImageRoutes().routes, ...createDropboxRoutes().routes },
  });

describe("DropboxReturn", () => {
  test("つなぐと、取り込みの画面へ移り、履歴に code を残さないこと", async () => {
    const { history } = open(
      `code=${FAKE_DROPBOX_RETURN.code}&state=${FAKE_DROPBOX_RETURN.state}`,
    );

    await userEvent.click(
      await screen.findByRole("button", { name: "つなぐ" }),
    );

    expect(await screen.findByText("Kirisame Test")).toBeDefined();
    expect(history.location.pathname).toBe("/images/dropbox");
    expect(history.location.search).toBe("");
  });

  test("期限を過ぎた認可・許可しなかったこと・Dropbox からでない URL を、それぞれ伝えること", async () => {
    open(`code=${FAKE_DROPBOX_RETURN.code}&state=old`);
    await userEvent.click(
      await screen.findByRole("button", { name: "つなぐ" }),
    );

    expect(await screen.findByText(/時間が経ちすぎたか/v)).toBeDefined();
    cleanup();

    open("error=access_denied&state=s");

    expect(
      await screen.findByText(
        "Dropbox で許可しなかったので、つなぎませんでした。",
      ),
    ).toBeDefined();
    cleanup();

    open("");

    expect(
      await screen.findByText(/Dropbox から戻ったときに開きます/v),
    ).toBeDefined();
    expect(
      screen
        .getByRole("link", { name: "取り込みの画面に戻る" })
        .getAttribute("href"),
    ).toBe("/images/dropbox");
  });
});
