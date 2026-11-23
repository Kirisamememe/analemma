import { act, cleanup, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test } from "bun:test";

import type { FakeReply } from "@/testing/create-fake-api";
import {
  createImageRoutes,
  type FakeImageSeed,
} from "@/testing/fake-routes/create-image-routes";
import { renderApp } from "@/testing/render-app";

afterEach(cleanup);

const IMAGES: readonly FakeImageSeed[] = [
  { title: "夕暮れの稜線" },
  { title: "港の灯り", alt: "夜の港" },
  { title: "雪の参道" },
];

const setUp = (at: number | string) => {
  const server = createImageRoutes(IMAGES);

  const path =
    typeof at === "string" ? at : `/images/${server.images()[at]?.id ?? ""}`;

  const { history, calls } = renderApp({ path, routes: server.routes });

  return { server, history, calls, ids: server.images().map(({ id }) => id) };
};

const expectLinkFocus = (name: string) =>
  waitFor(() => {
    expect(document.activeElement).toBe(screen.getByRole("link", { name }));
  });

const heading = async (name: string) =>
  screen.findByRole("heading", { level: 1, name });

describe("ImageViewerPage", () => {
  test("画像の URL を直接開くと、セッション確認の応答を待たずに写真を見る画面を描く", async () => {
    const server = createImageRoutes(IMAGES);
    const session = Promise.withResolvers<FakeReply<"admin/session/get">>();

    const { calls } = renderApp({
      path: `/images/${server.images()[0]?.id ?? ""}`,
      routes: { ...server.routes, "admin/session/get": () => session.promise },
    });

    await heading("夕暮れの稜線");
    expect(calls).toContain("admin/session/get");
    session.resolve({ output: { expiresAt: "2026-01-08T00:00:00.000Z" } });
  });

  test("一覧から写真を開き、キーボードで前後に移って同じ方向のリンクに戻れる", async () => {
    const { history, ids } = setUp("/images");

    await userEvent.click(
      await screen.findByRole("link", { name: /夕暮れの稜線/v }),
    );
    await heading("夕暮れの稜線");
    expect(history.location.pathname).toBe(`/images/${ids[0] ?? ""}`);
    const user = userEvent.setup();
    const next = await screen.findByRole("link", { name: "次の画像" });

    act(() => {
      next.focus();
    });
    await user.keyboard("{Enter}");
    await heading("港の灯り");
    await expectLinkFocus("次の画像");
    await user.keyboard("{Enter}");
    await heading("雪の参道");
    expect(history.location.pathname).toBe(`/images/${ids[2] ?? ""}`);
    expect(screen.queryByRole("link", { name: "次の画像" })).toBeNull();
    await expectLinkFocus("前の画像");
  });

  test("前後の取得に失敗しても写真を表示し、取り直した後は同じ向きのリンクへ focus を戻す", async () => {
    const server = createImageRoutes(IMAGES);
    let offline = false;

    const { queryClient } = renderApp({
      path: `/images/${server.images()[2]?.id ?? ""}`,
      routes: {
        ...server.routes,
        "admin/images/neighbors": (input) =>
          offline
            ? { error: "INTERNAL_SERVER_ERROR", defined: false }
            : server.routes["admin/images/neighbors"](input),
      },
    });

    queryClient.setDefaultOptions({ queries: { retry: false } });
    const previous = await screen.findByRole("link", { name: "前の画像" });
    offline = true;
    previous.focus();
    await userEvent.keyboard("{Enter}");
    await heading("港の灯り");
    const retry = await screen.findByRole("button", { name: "もう一度試す" });
    await waitFor(() => {
      expect(document.activeElement).toBe(retry);
    });
    offline = false;
    await userEvent.keyboard("{Enter}");
    await waitFor(() => {
      expect(document.activeElement).toBe(
        screen.getByRole("link", { name: "前の画像" }),
      );
    });
    await userEvent.keyboard("{Enter}");
    await heading("夕暮れの稜線");
  }, 15_000);

  test.each(["loading", "failed", "gone", "photo"] as const)(
    "画像の画面には %s のときも main が1つある",
    async (state) => {
      const server = createImageRoutes(IMAGES);
      const [photo] = server.images();

      if (photo === undefined) throw new Error("画像が必要です");

      if (state === "loading") {
        server.replyNext(
          "admin/images/get",
          () => Promise.withResolvers<FakeReply<"admin/images/get">>().promise,
        );
      }

      if (state === "failed") {
        server.replyNext("admin/images/get", () => ({
          error: "INTERNAL_SERVER_ERROR",
          defined: false,
        }));
      }

      const id =
        state === "gone" ? "019b0000-0000-7000-8000-0000000000ff" : photo.id;

      const app = renderApp({ path: "/images/" + id, routes: server.routes });
      app.queryClient.setDefaultOptions({ queries: { retry: false } });
      const main = await screen.findByRole("main");
      const page = within(main);

      if (state === "photo") {
        await page.findByRole("heading", { name: "夕暮れの稜線" });
      }

      if (state === "gone") {
        await page.findByRole("heading", {
          level: 1,
          name: "この画像はもうありません。",
        });
      }

      if (state === "failed") await page.findByRole("heading", { level: 1 });

      if (state === "loading") await page.findByRole("status");

      expect(screen.getAllByRole("main")).toHaveLength(1);
    },
  );

  test("移った写真の前後とも無いときは、一覧へのリンクに focus を戻す", async () => {
    const { server } = setUp(0);
    await heading("夕暮れの稜線");
    server.replyNext("admin/images/neighbors", () => ({
      output: { newer: null, older: null },
    }));
    const next = await screen.findByRole("link", { name: "次の画像" });
    next.focus();
    await userEvent.keyboard("{Enter}");
    await heading("港の灯り");
    await waitFor(() => {
      expect(document.activeElement).toBe(
        screen.getByRole("link", { name: "画像の一覧" }),
      );
    });
  });

  test("画像と前後の行き先を待ってから同じ向きに focus を戻し、端では逆側のリンクに移す", async () => {
    const { server } = setUp(0);
    await heading("夕暮れの稜線");
    const back = screen.getByRole("link", { name: "画像の一覧" });
    const next = await screen.findByRole("link", { name: "次の画像" });
    const get = Promise.withResolvers<FakeReply<"admin/images/get">>();

    const neighbors =
      Promise.withResolvers<FakeReply<"admin/images/neighbors">>();

    server.replyNext("admin/images/get", () => get.promise);
    server.replyNext("admin/images/neighbors", () => neighbors.promise);
    next.focus();
    await userEvent.keyboard("{Enter}");
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "編集" }).hasAttribute("disabled"),
      ).toBe(true);
    });
    expect(screen.getByRole("link", { name: "画像の一覧" })).toBe(back);
    expect(
      screen.getByRole("button", { name: "編集" }).hasAttribute("disabled"),
    ).toBe(true);
    const [first, second, last] = server.images();

    if (first === undefined || second === undefined || last === undefined) {
      throw new Error("画像が3枚必要です");
    }

    get.resolve({ output: second });
    await heading("港の灯り");
    neighbors.resolve({ output: { newer: first.id, older: last.id } });
    await waitFor(() => {
      expect(document.activeElement).toBe(
        screen.getByRole("link", { name: "次の画像" }),
      );
    });
    await userEvent.keyboard("{Enter}");
    await heading("雪の参道");
    await waitFor(() => {
      expect(document.activeElement).toBe(
        screen.getByRole("link", { name: "前の画像" }),
      );
    });
    expect(screen.getByRole("link", { name: "画像の一覧" })).toBe(back);
  });

  test("取得を待つ間に一覧へのリンクへ移した focus をそのまま保つ", async () => {
    const { server } = setUp(0);
    await heading("夕暮れの稜線");
    const back = screen.getByRole("link", { name: "画像の一覧" });
    const next = await screen.findByRole("link", { name: "次の画像" });
    const get = Promise.withResolvers<FakeReply<"admin/images/get">>();
    server.replyNext("admin/images/get", () => get.promise);
    next.focus();
    await userEvent.keyboard("{Enter}");
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "編集" }).hasAttribute("disabled"),
      ).toBe(true);
    });
    back.focus();
    const second = server.images()[1];

    if (second === undefined) throw new Error("画像が2枚必要です");

    get.resolve({ output: second });
    await heading("港の灯り");
    expect(document.activeElement).toBe(back);
  });

  test("非公開の確認を取り消すと公開を保ち、確定したときだけ非公開にする", async () => {
    const { server, calls } = setUp(0);

    await heading("夕暮れの稜線");
    await userEvent.click(screen.getByRole("button", { name: "非公開にする" }));

    const dialog = await screen.findByRole("dialog", {
      name: /夕暮れの稜線.*非公開/v,
    });

    await userEvent.click(
      within(dialog).getByRole("button", { name: "キャンセル" }),
    );
    expect(calls).not.toContain("admin/images/unpublish");
    expect(server.images()[0]?.published).toBe(true);
    await userEvent.click(screen.getByRole("button", { name: "非公開にする" }));
    await userEvent.click(
      within(await screen.findByRole("dialog")).getByRole("button", {
        name: "非公開にする",
      }),
    );
    expect(await screen.findByText("画像を非公開にしました。")).toBeDefined();
    expect(
      within(screen.getByRole("complementary")).getByText("非公開"),
    ).toBeDefined();
    expect(screen.getByRole("button", { name: "公開する" })).toBeDefined();
    expect(server.images()[0]?.published).toBe(false);
  });

  test("読み込んだ最後の写真を削除すると、一覧に戻って削除を知らせ、続きを読める", async () => {
    const server = createImageRoutes(IMAGES);

    const { history } = renderApp({
      path: "/images",
      routes: {
        ...server.routes,
        "admin/images/list": (input) =>
          server.routes["admin/images/list"]({ ...input, limit: 1 }),
      },
    });

    await userEvent.click(
      await screen.findByRole("link", { name: /夕暮れの稜線/v }),
    );

    await heading("夕暮れの稜線");
    await userEvent.click(screen.getByRole("button", { name: "画像を削除" }));

    const dialog = await screen.findByRole("dialog", {
      name: "「夕暮れの稜線」を削除しますか?",
      description: /削除した画像は元に戻せません/v,
    });

    await userEvent.click(within(dialog).getByRole("button", { name: "削除" }));
    expect(
      await screen.findByText("「夕暮れの稜線」を削除しました。"),
    ).toBeDefined();
    await waitFor(() => {
      expect(history.location.pathname).toBe("/images");
    });
    expect(server.images()).toHaveLength(2);
    expect(
      screen.queryByRole("heading", { name: "画像はまだありません" }),
    ).toBeNull();
    await userEvent.click(
      await screen.findByRole("button", { name: "さらに読み込む" }),
    );
    await screen.findByRole("link", { name: /港の灯り/v });
  });

  test("ほかの画面で削除済みの画像を削除すると、削除の確認を閉じて一覧にも反映する", async () => {
    const { server, ids } = setUp("/images");
    const id = ids[0] ?? "";
    await userEvent.click(
      await screen.findByRole("link", { name: /夕暮れの稜線/v }),
    );
    await heading("夕暮れの稜線");
    await userEvent.click(screen.getByRole("button", { name: "画像を削除" }));
    const dialog = await screen.findByRole("dialog");
    server.routes["admin/images/delete"]({ id });
    await userEvent.click(within(dialog).getByRole("button", { name: "削除" }));
    await waitFor(() => {
      expect(screen.queryByRole("button", { name: "編集" })).toBeNull();
      expect(screen.queryByRole("dialog")).toBeNull();
    });
    await userEvent.click(screen.getByRole("link", { name: "画像の一覧" }));
    await screen.findByRole("link", { name: /港の灯り/v });
    expect(screen.queryByRole("link", { name: /夕暮れの稜線/v })).toBeNull();
  });

  test("無い画像を開くと、もう無いことを知らせる", async () => {
    setUp("/images/019b0000-0000-7000-8000-0000000000ff");

    expect(await screen.findByText("この画像はもうありません。")).toBeDefined();
    expect(screen.getByRole("link", { name: "画像の一覧" })).toBeDefined();
  });
});
