import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test } from "bun:test";

import {
  createDropboxRoutes,
  FAKE_DROPBOX_CONNECTED,
  type FakeDropboxPhoto,
} from "@/testing/fake-routes/create-dropbox-routes";
import { createImageRoutes } from "@/testing/fake-routes/create-image-routes";
import { renderApp } from "@/testing/render-app";

afterEach(cleanup);

const AT = "2026-03-01T09:00:00.000Z";
const IMAGE_ID = "019b0000-0000-7000-8000-000000000009";

const photo = (
  path: string,
  imported: FakeDropboxPhoto["imported"] = null,
): FakeDropboxPhoto => ({
  id: `id:${path.replaceAll(/[^\w]/gv, "")}`,
  path,
  size: 19_293_798,
  modifiedAt: AT,
  imported,
  contentHash: "a".repeat(64),
});

const open = (photos: readonly FakeDropboxPhoto[]) => {
  const dropbox = createDropboxRoutes({
    connection: FAKE_DROPBOX_CONNECTED,
    photos,
  });

  renderApp({
    path: "/images/dropbox",
    routes: { ...createImageRoutes().routes, ...dropbox.routes },
  });

  return dropbox;
};

describe("DropboxPhotos", () => {
  test("Dropbox の側で切られていれば、つなぎ直す操作を出すこと", async () => {
    renderApp({
      path: "/images/dropbox",
      routes: {
        ...createImageRoutes().routes,
        ...createDropboxRoutes({
          connection: FAKE_DROPBOX_CONNECTED,
          lost: true,
        }).routes,
      },
    });

    expect(
      await screen.findByText(/Dropbox との接続が切れました/v),
    ).toBeDefined();
    expect(
      screen.getByRole("button", { name: "もう一度つなぐ" }),
    ).toBeDefined();
  });

  test("App folder が空なら、写真の置き場所を伝えること", async () => {
    open([]);

    expect(
      await screen.findByText("App folder に写真がありません"),
    ).toBeDefined();
    expect(
      screen.getByRole("button", { name: "新しい写真はありません" }),
    ).toHaveProperty("disabled", true);
  });

  test("取り込み済みの写真は作った画像へのリンクにし、新しい写真の数だけ取り込めること", async () => {
    open([
      photo("/2025-11/DSC09812.jpg"),
      photo("/夕暮れの稜線.jpg", { imageId: IMAGE_ID, importedAt: AT }),
    ]);

    expect(
      (
        await screen.findByRole("link", { name: "夕暮れの稜線.jpg" })
      ).getAttribute("href"),
    ).toBe(`/images/${IMAGE_ID}`);
    expect(screen.getByText("新しい")).toBeDefined();
    expect(screen.getByText("新しい写真 1枚・取り込み済み 1枚")).toBeDefined();
  });

  test("取り込むと、写真ごとの状態と進み具合を出すこと", async () => {
    const dropbox = open([photo("/a.jpg"), photo("/b.jpg")]);

    await userEvent.click(
      await screen.findByRole("button", { name: "新しい写真を2枚取り込む" }),
    );

    expect(
      await screen.findByText("2枚のうち0枚を取り込みました"),
    ).toBeDefined();
    expect(screen.getAllByText("待っています")).toHaveLength(2);
    expect(
      screen.getByRole("button", { name: "取り込んでいます" }),
    ).toHaveProperty("disabled", true);

    dropbox.advance();
    dropbox.advance();

    expect(
      await screen.findByText(
        "2枚のうち2枚を足しました。",
        {},
        { timeout: 3000 },
      ),
    ).toBeDefined();
    expect(screen.getAllByText("足した")).toHaveLength(2);
  });
});
