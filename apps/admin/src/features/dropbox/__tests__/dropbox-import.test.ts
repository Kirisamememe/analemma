import { cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, spyOn, test } from "bun:test";

import {
  createDropboxRoutes,
  FAKE_DROPBOX_CONNECTED,
  type FakeDropboxSeed,
} from "@/testing/fake-routes/create-dropbox-routes";
import { createImageRoutes } from "@/testing/fake-routes/create-image-routes";
import { renderApp } from "@/testing/render-app";

afterEach(cleanup);

const open = (seed: FakeDropboxSeed) => {
  const dropbox = createDropboxRoutes(seed);

  renderApp({
    path: "/images/dropbox",
    routes: { ...createImageRoutes().routes, ...dropbox.routes },
  });

  return dropbox;
};

describe("DropboxImport", () => {
  test("server に設定が無ければ、つなぐ操作の代わりに設定の知らせを出すこと", async () => {
    open({ connection: { status: "unconfigured" } });

    expect(
      await screen.findByText(/DROPBOX_APP_KEY・DROPBOX_APP_SECRET/v),
    ).toBeDefined();
    expect(
      screen.queryByRole("button", { name: "Dropbox につなぐ" }),
    ).toBeNull();
  });

  test("つないでいなければ、つなぐ操作で Dropbox の認可の画面を開くこと", async () => {
    const assign = spyOn(window.location, "assign").mockImplementation(
      () => undefined,
    );

    open({});

    await userEvent.click(
      await screen.findByRole("button", { name: "Dropbox につなぐ" }),
    );

    await waitFor(() => {
      expect(assign).toHaveBeenCalledWith(
        "https://www.dropbox.com/oauth2/authorize?state=fake-state",
      );
    });

    assign.mockRestore();
  });

  test("つないでいれば、アカウントを出し、切ると、つなぐ操作に戻ること", async () => {
    open({ connection: FAKE_DROPBOX_CONNECTED });

    expect(await screen.findByText("Kirisame Test")).toBeDefined();

    await userEvent.click(screen.getByRole("button", { name: "接続を切る" }));

    expect(
      await screen.findByRole("button", { name: "Dropbox につなぐ" }),
    ).toBeDefined();
  });
});
